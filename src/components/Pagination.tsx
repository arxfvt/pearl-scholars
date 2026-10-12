import Link from "next/link";

export default function Pagination({ page, pages, params }: { page: number; pages: number; params: Record<string, string | undefined> }) {
  if (pages <= 1) return null;
  const href = (p: number) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v && sp.set(k, v));
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return `/scholarships${qs ? `?${qs}` : ""}`;
  };
  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-3">
      {page > 1 ? <Link href={href(page - 1)} className="btn btn-outline">Previous</Link> : <span />}
      <span className="text-sm">Page {page} of {pages}</span>
      {page < pages ? <Link href={href(page + 1)} className="btn btn-outline">Next</Link> : <span />}
    </nav>
  );
}
