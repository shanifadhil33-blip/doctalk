/**
 * Shared decision for an atomic counter.
 * A missing row starts at 1. A row already at the cap is rejected.
 * Postgres applies this with INSERT ... ON CONFLICT DO UPDATE ... RETURNING,
 * which locks the settings row so concurrent callers cannot both pass.
 */
export function nextAtomicCount(current: number | null, cap: number): number | null {
  if (!Number.isInteger(cap) || cap < 1) return null;
  const used = current ?? 0;
  if (!Number.isInteger(used) || used < 0 || used >= cap) return null;
  return used + 1;
}

export type QuotaIncrement = (key: string, cap: number) => Promise<number | null>;

/** In-memory row lock. Tests use this to prove parallel increments stop at the cap. */
export function createRowLockCounter(): QuotaIncrement {
  const values = new Map<string, number>();
  const tails = new Map<string, Promise<void>>();

  return (key, cap) => {
    const previous = tails.get(key) ?? Promise.resolve();
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    tails.set(key, previous.then(() => gate));
    return previous.then(() => {
      try {
        const next = nextAtomicCount(values.get(key) ?? null, cap);
        if (next !== null) values.set(key, next);
        return next;
      } finally {
        release();
      }
    });
  };
}

export type SlotDocument = {
  id: string;
  userId: string;
  fileUrl: string;
  isDemo: boolean;
};

export type SlotState = {
  counts: Map<string, number>;
  docs: SlotDocument[];
};

export type ReservationInput = {
  userId: string;
  uploadId: string;
  fileName: string;
  cap: number;
};

export type ReservationOutcome =
  | { ok: true; documentId: string; created: boolean }
  | { ok: false; reason: "limit" | "taken" };

export function pendingFileUrl(uploadId: string): string {
  return `pending:${uploadId}`;
}

export function documentSlotKey(userId: string): string {
  return `doc_slots:${userId}`;
}

/**
 * One reservation step. Callers that represent the database statement must run
 * this under a per-user lock. The SQL statement does the same work in one
 * INSERT ... ON CONFLICT so two requests cannot both pass the cap.
 */
export function applyDocumentReservation(
  state: SlotState,
  input: ReservationInput,
  newId: () => string,
): ReservationOutcome {
  const pending = pendingFileUrl(input.uploadId);
  const existing = state.docs.find(
    (doc) => doc.userId === input.userId && doc.fileUrl === pending && !doc.isDemo,
  );
  if (existing) {
    return { ok: true, documentId: existing.id, created: false };
  }

  if (state.docs.some((doc) => doc.fileUrl === pending)) {
    return { ok: false, reason: "taken" };
  }

  const owned = state.docs.filter((doc) => doc.userId === input.userId && !doc.isDemo).length;
  const countKey = documentSlotKey(input.userId);
  if (!state.counts.has(countKey)) {
    if (owned >= input.cap) return { ok: false, reason: "limit" };
    state.counts.set(countKey, owned + 1);
  } else {
    const next = nextAtomicCount(state.counts.get(countKey) ?? null, input.cap);
    if (next === null || owned >= input.cap) return { ok: false, reason: "limit" };
    state.counts.set(countKey, next);
  }

  const id = newId();
  state.docs.push({
    id,
    userId: input.userId,
    fileUrl: pending,
    isDemo: false,
  });
  return { ok: true, documentId: id, created: true };
}

export function applyDocumentRelease(
  state: SlotState,
  userId: string,
  documentId: string,
): boolean {
  const index = state.docs.findIndex(
    (doc) => doc.id === documentId && doc.userId === userId && !doc.isDemo,
  );
  if (index < 0) return false;
  state.docs.splice(index, 1);
  const countKey = documentSlotKey(userId);
  const current = state.counts.get(countKey);
  if (current === undefined) return true;
  state.counts.set(countKey, Math.max(0, current - 1));
  return true;
}

export function createSerializedReservations(state: SlotState) {
  const tails = new Map<string, Promise<void>>();
  let sequence = 0;

  return (input: ReservationInput): Promise<ReservationOutcome> => {
    const previous = tails.get(input.userId) ?? Promise.resolve();
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    tails.set(input.userId, previous.then(() => gate));
    return previous.then(() => {
      try {
        sequence += 1;
        const id = `doc-${sequence}`;
        return applyDocumentReservation(state, input, () => id);
      } finally {
        release();
      }
    });
  };
}
