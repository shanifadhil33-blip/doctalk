import { describe, expect, it } from "vitest";
import { isDocumentVisible } from "@/lib/documents/visibility";
import {
  exposeUserIdOnSession,
  userIdFromGoogleProfile,
  userIdFromTokenSub,
  withGoogleUserId,
} from "./user-id";

const googleSub = "104283746551029384756";

describe("userIdFromTokenSub", () => {
  it("uses a non-empty token.sub as the user id", () => {
    expect(userIdFromTokenSub(googleSub)).toBe(googleSub);
    expect(userIdFromTokenSub(`  ${googleSub}  `)).toBe(googleSub);
  });

  it("rejects empty and non-string values", () => {
    expect(userIdFromTokenSub("")).toBeNull();
    expect(userIdFromTokenSub("   ")).toBeNull();
    expect(userIdFromTokenSub(undefined)).toBeNull();
    expect(userIdFromTokenSub(104283746551029384756)).toBeNull();
  });
});

describe("Google sign-in mapping", () => {
  it("prefers profile.sub over providerAccountId", () => {
    expect(
      userIdFromGoogleProfile({
        sub: googleSub,
        providerAccountId: "other-account",
      }),
    ).toBe(googleSub);
  });

  it("falls back to providerAccountId when profile.sub is missing", () => {
    expect(
      userIdFromGoogleProfile({
        sub: " ",
        providerAccountId: googleSub,
      }),
    ).toBe(googleSub);
  });

  it("writes the Google id onto token.sub", () => {
    const token = withGoogleUserId(
      { sub: "pending", name: "Ada" },
      { sub: googleSub },
    );

    expect(token.sub).toBe(googleSub);
    expect(token.name).toBe("Ada");
  });

  it("keeps the existing token.sub when the sign-in source is empty", () => {
    const token = { sub: googleSub };
    expect(withGoogleUserId(token, {})).toEqual(token);
  });

  it("exposes token.sub on the session user", () => {
    const session = exposeUserIdOnSession(
      {
        user: {
          name: "Ada",
          email: "ada@example.com",
          id: undefined,
        },
        expires: "2099-01-01T00:00:00.000Z",
      },
      googleSub,
    );

    expect(session.user?.id).toBe(googleSub);
  });

  it("leaves a session without a user unchanged", () => {
    const session = { user: null, expires: "2099-01-01T00:00:00.000Z" };
    expect(exposeUserIdOnSession(session, googleSub)).toEqual(session);
  });
});

describe("visibility viewer id", () => {
  it("treats the Google sub as the document owner id", () => {
    const viewerUserId = userIdFromTokenSub(googleSub);

    expect(
      isDocumentVisible({ userId: viewerUserId, isDemo: false }, viewerUserId),
    ).toBe(true);
    expect(
      isDocumentVisible(
        { userId: "someone-else", isDemo: false },
        viewerUserId,
      ),
    ).toBe(false);
    expect(
      isDocumentVisible({ userId: "someone-else", isDemo: true }, null),
    ).toBe(true);
  });
});
