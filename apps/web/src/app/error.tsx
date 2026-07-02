"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";

/** Root error boundary — shows a friendly recovery screen for uncaught errors. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the error for debugging without crashing the app.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg-primary px-4 text-center">
      <AlertTriangle size={40} className="text-warning" strokeWidth={1.5} />
      <h1 className="font-display text-2xl text-text-primary">Something went wrong</h1>
      <p className="max-w-sm text-sm text-text-secondary">
        An unexpected error occurred. You can try again — if it keeps happening, reload the page.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
