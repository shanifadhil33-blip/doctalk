/**
 * DocTalk viewer ids are Google's stable account id, which Auth.js stores on
 * the JWT as `sub` and copies onto the session.
 */
export function userIdFromTokenSub(sub: unknown): string | null {
  if (typeof sub !== "string") {
    return null;
  }

  const trimmed = sub.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Prefer the OIDC `sub` claim. `providerAccountId` is the same Google account
 * id when the profile claim is missing on the sign-in callback.
 */
export function userIdFromGoogleProfile(source: {
  sub?: unknown;
  providerAccountId?: unknown;
}): string | null {
  return (
    userIdFromTokenSub(source.sub) ??
    userIdFromTokenSub(source.providerAccountId)
  );
}

export function withGoogleUserId<T extends { sub?: string }>(
  token: T,
  source: { sub?: unknown; providerAccountId?: unknown },
): T {
  const userId = userIdFromGoogleProfile(source);
  if (!userId) {
    return token;
  }

  return { ...token, sub: userId };
}

export function exposeUserIdOnSession<
  T extends { user?: ({ id?: string | null } & object) | null },
>(session: T, tokenSub: unknown): T {
  const userId = userIdFromTokenSub(tokenSub);
  if (!userId || !session.user) {
    return session;
  }

  return {
    ...session,
    user: { ...session.user, id: userId },
  };
}
