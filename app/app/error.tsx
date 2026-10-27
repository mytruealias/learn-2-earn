"use client";
import { ErrorState } from "../components/ui";
export default function HomeError({ reset }: { reset: () => void }) {
  return (
    <main style={{ padding: "2rem" }}>
      <ErrorState onRetry={reset}>
        Your learning space could not load. Check your connection and try again.
        Your saved work has not been deleted.
      </ErrorState>
    </main>
  );
}
