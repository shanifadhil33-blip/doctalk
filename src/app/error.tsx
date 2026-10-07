"use client";

import { ErrorScreen } from "@/components/ErrorScreen";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorScreen reset={reset} />;
}
