"use client";

import { createContext, useContext, type ReactNode } from "react";

const SignedInContext = createContext(false);

export function SessionFlag({
  signedIn,
  children,
}: {
  signedIn: boolean;
  children: ReactNode;
}) {
  return <SignedInContext.Provider value={signedIn}>{children}</SignedInContext.Provider>;
}

export function useSignedIn(): boolean {
  return useContext(SignedInContext);
}
