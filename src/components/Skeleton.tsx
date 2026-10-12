export function CardGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card h-72 animate-pulse bg-line/40" />
      ))}
    </div>
  );
}

export function BlockSkeleton({ h = "h-48" }: { h?: string }) {
  return <div className={`card ${h} animate-pulse bg-line/40`} aria-busy="true" aria-label="Loading" />;
}
