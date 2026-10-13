import { Suspense } from "react";
import Link from "next/link";
import { getAdmin } from "@/lib/auth";

async function Inner({ links }: { links: { href: string; label: string }[] }) {
  if (!(await getAdmin())) return null;
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-ink/40 bg-surface p-2 text-sm">
      <span className="rounded bg-ink px-2 py-0.5 text-xs font-bold text-gold">ADMIN</span>
      {links.map((l) => <Link key={l.href} href={l.href} className="btn btn-gold min-h-9 px-3 py-1 text-sm">{l.label}</Link>)}
    </div>
  );
}

/** Edit shortcuts shown only to signed-in admins on public pages. Invisible (and not rendered) for everyone else. */
export default function AdminShortcut(props: { links: { href: string; label: string }[] }) {
  return <Suspense fallback={null}><Inner {...props} /></Suspense>;
}
