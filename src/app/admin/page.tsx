import { connection } from "next/server";
import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { countsPerScholarship } from "@/lib/data/registrations";
import { BlockSkeleton } from "@/components/Skeleton";

export default function Page() {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl">Overview</h1>
        <div className="flex gap-2">
          <Link href="/admin/registrations" className="btn btn-outline">View registrations</Link>
          <Link href="/admin/scholarships/new" className="btn btn-gold">Add scholarship</Link>
        </div>
      </div>
      <Suspense fallback={<div className="mt-6"><BlockSkeleton /></div>}><Stats /></Suspense>
    </>
  );
}

async function Stats() {
  await connection();
  const supabase = await createClient();
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const head = { count: "exact" as const, head: true };
  const [regs, week, shortlisted, successful, published, drafts, per, { data: recent }] = await Promise.all([
    supabase.from("registrations").select("id", head),
    supabase.from("registrations").select("id", head).gte("created_at", weekAgo),
    supabase.from("registrations").select("id", head).eq("status", "shortlisted"),
    supabase.from("registrations").select("id", head).eq("status", "successful"),
    supabase.from("scholarships").select("id", head).eq("status", "published"),
    supabase.from("scholarships").select("id", head).eq("status", "draft"),
    countsPerScholarship(),
    supabase.from("registrations").select("gender,district,level").gte("created_at", new Date(Date.now() - 365 * 86400000).toISOString()).limit(20000),
  ]);

  const tiles: [string, number | null, string?][] = [
    ["Students registered", regs.count, "/admin/registrations"],
    ["This week", week.count],
    ["Shortlisted", shortlisted.count, "/admin/registrations?status=shortlisted"],
    ["Successful", successful.count, "/admin/registrations?status=successful"],
    ["Open scholarships", published.count, "/admin/scholarships"],
    ["Drafts", drafts.count, "/admin/scholarships"],
  ];

  // Simple planning breakdowns for the last 12 months.
  const tally = (key: "gender" | "district") => {
    const m = new Map<string, number>();
    (recent ?? []).forEach((r) => { const k = (r[key] as string | null) ?? "Not given"; m.set(k, (m.get(k) ?? 0) + 1); });
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };
  const genders = tally("gender");
  const districts = tally("district").slice(0, 8);

  return (
    <>
      <dl className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {tiles.map(([label, n, href]) => {
          const inner = <><dt className="text-sm text-muted">{label}</dt><dd className="text-3xl font-extrabold">{n ?? 0}</dd></>;
          return href ? <Link key={label} href={href} className="card p-4 hover:border-ink">{inner}</Link> : <div key={label} className="card p-4">{inner}</div>;
        })}
      </dl>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="card p-5 lg:col-span-2">
          <h2 className="text-lg">Top scholarships by registrations</h2>
          <ul className="mt-3 divide-y divide-line">
            {per.filter((s) => s.total > 0).slice(0, 8).map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <Link href={`/admin/registrations?scholarship=${s.id}`} className="truncate underline">{s.title}</Link>
                <strong>{s.total}</strong>
              </li>
            ))}
            {!per.some((s) => s.total > 0) && <li className="py-2 text-sm text-muted">No registrations yet.</li>}
          </ul>
        </section>
        <section className="card space-y-4 p-5">
          <div>
            <h2 className="text-lg">By gender</h2>
            <ul className="mt-2 space-y-1 text-sm">{genders.length ? genders.map(([k, n]) => <li key={k} className="flex justify-between capitalize"><span>{k.replace(/_/g, " ")}</span><strong>{n}</strong></li>) : <li className="text-muted">No data yet.</li>}</ul>
          </div>
          <div>
            <h2 className="text-lg">Top districts</h2>
            <ul className="mt-2 space-y-1 text-sm">{districts.length ? districts.map(([k, n]) => <li key={k} className="flex justify-between"><span>{k}</span><strong>{n}</strong></li>) : <li className="text-muted">No data yet.</li>}</ul>
          </div>
        </section>
      </div>
    </>
  );
}
