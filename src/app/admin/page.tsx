import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BlockSkeleton } from "@/components/Skeleton";

export default function Page() {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl">Overview</h1>
        <Link href="/admin/scholarships/new" className="btn btn-gold">Add scholarship</Link>
      </div>
      <Suspense fallback={<div className="mt-6"><BlockSkeleton /></div>}><Stats /></Suspense>
    </>
  );
}

async function Stats() {
  const supabase = await createClient();
  const count = (status?: string) => {
    let q = supabase.from("scholarships").select("id", { count: "exact", head: true });
    if (status) q = q.eq("status", status);
    return q;
  };
  const [all, published, drafts, closed, regs] = await Promise.all([
    count(), count("published"), count("draft"), count("closed"),
    supabase.from("registrations").select("id", { count: "exact", head: true }),
  ]);
  const tiles = [
    ["Scholarships", all.count], ["Published", published.count], ["Drafts", drafts.count], ["Closed", closed.count], ["Registrations", regs.count],
  ] as const;
  return (
    <dl className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {tiles.map(([label, n]) => (
        <div key={label} className="card p-4"><dt className="text-sm text-muted">{label}</dt><dd className="text-3xl font-extrabold">{n ?? 0}</dd></div>
      ))}
    </dl>
  );
}
