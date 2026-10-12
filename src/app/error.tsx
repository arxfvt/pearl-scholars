"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-3xl">Something went wrong</h1>
      <p className="mt-2 text-muted">Please try again. If it keeps happening, contact us.</p>
      <button onClick={reset} className="btn btn-gold mt-6">Try again</button>
    </div>
  );
}
