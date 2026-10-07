function holdUntilPageHides(): Promise<void> {
  return new Promise((resolve) => {
    window.addEventListener("pagehide", () => resolve(), { once: true });
  });
}

function isSuccess(body: unknown): boolean {
  return typeof body === "object" && body !== null && "ok" in body && body.ok === true;
}

/**
 * One POST that clears the session, then a full document load of the landing page.
 * This stays off the App Router action queue, so a concurrent RSC refresh cannot
 * cancel it or paint the confirm dialog's error state.
 */
export async function signOutToLanding(): Promise<void> {
  let response: Response;
  try {
    response = await fetch("/api/auth/sign-out", {
      method: "POST",
      credentials: "same-origin",
      redirect: "manual",
      headers: { Accept: "application/json" },
    });
  } catch {
    throw new Error("Couldn't sign out");
  }

  const redirected = response.type === "opaqueredirect" || (response.status >= 300 && response.status < 400);
  if (redirected) {
    window.location.replace("/");
    await holdUntilPageHides();
    return;
  }

  if (!response.ok) {
    throw new Error("Couldn't sign out");
  }

  const body: unknown = await response.json().catch(() => null);
  if (!isSuccess(body)) {
    throw new Error("Couldn't sign out");
  }

  window.location.replace("/");
  await holdUntilPageHides();
}
