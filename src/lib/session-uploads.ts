export type SessionUpload = {
  id: string;
  fileName: string;
  sizeBytes: number;
  addedOn: string;
  addedLabel: string;
};

const STORAGE_KEY = "doctalk.sessionUploads";
const memoryFiles = new Map<string, File>();

function isSessionUpload(value: unknown): value is SessionUpload {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.fileName === "string" &&
    typeof record.sizeBytes === "number" &&
    typeof record.addedOn === "string" &&
    typeof record.addedLabel === "string"
  );
}

export function readSessionUploads(): SessionUpload[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSessionUpload);
  } catch {
    return [];
  }
}

export function saveSessionUpload(upload: SessionUpload): void {
  const existing = readSessionUploads().filter((item) => item.id !== upload.id);
  window.sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([upload, ...existing]),
  );
}

export function removeSessionUpload(id: string): void {
  const existing = readSessionUploads().filter((item) => item.id !== id);
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  memoryFiles.delete(id);
}

export function rememberUploadFile(id: string, file: File): void {
  memoryFiles.set(id, file);
}

export function recallUploadFile(id: string): File | undefined {
  return memoryFiles.get(id);
}

export function stampUpload(date: Date): { addedOn: string; addedLabel: string } {
  const addedOn = date.toISOString().slice(0, 10);
  const addedLabel = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${addedOn}T00:00:00Z`));
  return { addedOn, addedLabel };
}
