"use client";

import { ErrorScreen } from "@/components/ErrorScreen";
import "./globals.css";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-[#f5f6f8] text-[#1c1e21] antialiased">
        <ErrorScreen reset={reset} />
      </body>
    </html>
  );
}
