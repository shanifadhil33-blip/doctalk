import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import {
  filterVisibleDocuments,
  isDocumentVisible,
  visibleDocumentsWhere,
  type DocumentVisibility,
} from "./visibility";

const viewerUserId = "user_owner";
const otherUserId = "user_other";

const ownDocument: DocumentVisibility = {
  userId: viewerUserId,
  isDemo: false,
};

const otherUsersDocument: DocumentVisibility = {
  userId: otherUserId,
  isDemo: false,
};

const demoWithNullOwner: DocumentVisibility = {
  userId: null,
  isDemo: true,
};

const demoOwnedBySomeoneElse: DocumentVisibility = {
  userId: otherUserId,
  isDemo: true,
};

const publicWithNullOwner: DocumentVisibility = {
  userId: null,
  isDemo: false,
};

function compile(userId: string | null) {
  return new PgDialect().sqlToQuery(visibleDocumentsWhere(userId));
}

describe("signed out", () => {
  it("shows demo documents", () => {
    expect(isDocumentVisible(demoWithNullOwner, null)).toBe(true);
    expect(isDocumentVisible(demoOwnedBySomeoneElse, null)).toBe(true);
  });

  it("shows documents whose owner is null", () => {
    expect(isDocumentVisible(publicWithNullOwner, null)).toBe(true);
  });

  it("hides private documents", () => {
    expect(isDocumentVisible(ownDocument, null)).toBe(false);
    expect(isDocumentVisible(otherUsersDocument, null)).toBe(false);
  });

  it("returns only demo and public documents from a mixed list", () => {
    const visible = filterVisibleDocuments(
      [
        { id: "own", ...ownDocument },
        { id: "other", ...otherUsersDocument },
        { id: "demo", ...demoWithNullOwner },
        { id: "shared-demo", ...demoOwnedBySomeoneElse },
        { id: "public", ...publicWithNullOwner },
      ],
      null,
    );

    expect(visible.map((document) => document.id)).toEqual([
      "demo",
      "shared-demo",
      "public",
    ]);
  });
});

describe("signed in", () => {
  it("shows the viewer's own documents", () => {
    expect(isDocumentVisible(ownDocument, viewerUserId)).toBe(true);
    expect(
      isDocumentVisible({ userId: viewerUserId, isDemo: true }, viewerUserId),
    ).toBe(true);
  });

  it("a signed-in user cannot see another user's private document", () => {
    expect(isDocumentVisible(otherUsersDocument, viewerUserId)).toBe(false);

    const visible = filterVisibleDocuments(
      [
        { id: "own", ...ownDocument },
        { id: "other", ...otherUsersDocument },
        { id: "demo", ...demoWithNullOwner },
        { id: "shared-demo", ...demoOwnedBySomeoneElse },
      ],
      viewerUserId,
    );

    expect(visible.map((document) => document.id)).toEqual([
      "own",
      "demo",
      "shared-demo",
    ]);
    expect(
      visible.some(
        (document) => document.userId === otherUserId && !document.isDemo,
      ),
    ).toBe(false);
  });

  it("always shows demo documents", () => {
    expect(isDocumentVisible(demoWithNullOwner, viewerUserId)).toBe(true);
    expect(isDocumentVisible(demoOwnedBySomeoneElse, viewerUserId)).toBe(true);
    expect(isDocumentVisible(publicWithNullOwner, viewerUserId)).toBe(true);
  });
});

describe("visibleDocumentsWhere", () => {
  it("does not bind a user id when the viewer is signed out", () => {
    const query = compile(null);

    expect(query.sql).toBe(
      '("documents"."is_demo" = $1 or "documents"."user_id" is null)',
    );
    expect(query.params).toEqual([true]);
  });

  it("binds only the signed-in viewer", () => {
    const query = compile(viewerUserId);

    expect(query.sql).toBe(
      '(("documents"."is_demo" = $1 or "documents"."user_id" is null) or "documents"."user_id" = $2)',
    );
    expect(query.params).toEqual([true, viewerUserId]);
    expect(query.params).not.toContain(otherUserId);
  });
});
