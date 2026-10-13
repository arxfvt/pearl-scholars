import { connection } from "next/server";
import { Suspense } from "react";
import Link from "next/link";
import { queryRegistrations, countsPerScholarship, filtersFrom } from "@/lib/data/registrations";
import { levelLabels, statusLabels } from "@/lib/types";
import { formatDate } from "@/lib/format";
import RegistrationsTable from "@/components/admin/RegistrationsTable";
import { BlockSkeleton } from "@/components/Skeleton";

type SP = Promise<Record<string, string | string[] | undefined>>;

export default function Page({ searchParams }: { searchParams: SP }) {
  return (
    <>
      <h1 className="text-3xl">Student registrations</h1>
      <Suspense fallback={<div className="mt-6"><BlockSkeleton h="h-96" /></div>}><Content searchParams={searchParams} /></Suspense>
    </>
  );
}

async function Content({ searchParams }: { searchParams: SP }) {
  await connection();
  const sp = await searchParams;
  const f = filtersFrom(sp);
  const [res, perScholarship] = await Promise.all([queryRegistrations(f), countsPerScholarship()]);
  const grandTotal = perScholarship.reduce((n, s) => n + s.total, 0);
  const qs = new URLSearchParams(Object.entries(f).filter(([k, v]) => v && k !== "page").map(([k, v]) => [k, String(v)])).toString();
  const pageHref = (p: number) => `/admin/registrations?${qs}${qs ? "&" : ""}page=${p}`;

  return (
    <>
      <section className="mt-6">
        <h2 className="text-lg">Students per scholarship</h2>
        <p className="text-sm text-muted">{grandTotal} registration{grandTotal === 1 ? "" : "s"} in total. Click a scholarship to see its students.</p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {perScholarship.filter((s) => s.total > 0 || s.status === "published").map((s) => (
            <li key={s.id}>
              <Link href={`/admin/registrations?scholarship=${s.id}`} className={`card flex items-center justify-between gap-3 p-3 hover:border-ink ${f.scholarship === s.id ? "border-ink" : ""}`}>
                <span className="truncate text-sm font-medium">{s.title}</span>
                <span className="shrink-0 text-right"><strong className="text-xl">{s.total}</strong><span className="block text-xs text-muted">{s.successful} successful</span></span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <form className="card mt-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Filter registrations">
        <div className="lg:col-span-2">
          <label htmlFor="r-q" className="mb-1 block text-xs font-medium">Search name, email, phone, school or reference</label>
          <input id="r-q" name="q" defaultValue={f.q} className="input" />
        </div>
        <div>
          <label htmlFor="r-s" className="mb-1 block text-xs font-medium">Scholarship</label>
          <select id="r-s" name="scholarship" defaultValue={f.scholarship ?? ""} className="input">
            <option value="">All</option>
            {perScholarship.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="r-st" className="mb-1 block text-xs font-medium">Status</label>
          <select id="r-st" name="status" defaultValue={f.status ?? ""} className="input">
            <option value="">All</option>
            {Object.entries(statusLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="r-l" className="mb-1 block text-xs font-medium">Level</label>
          <select id="r-l" name="level" defaultValue={f.level ?? ""} className="input">
            <option value="">All</option>
            {Object.entries(levelLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="r-g" className="mb-1 block text-xs font-medium">Gender</label>
          <select id="r-g" name="gender" defaultValue={f.gender ?? ""} className="input">
            <option value="">All</option><option value="female">Female</option><option value="male">Male</option><option value="prefer_not_to_say">Prefer not to say</option>
          </select>
        </div>
        <div>
          <label htmlFor="r-d" className="mb-1 block text-xs font-medium">District</label>
          <input id="r-d" name="district" defaultValue={f.district} className="input" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div><label htmlFor="r-from" className="mb-1 block text-xs font-medium">From</label><input id="r-from" type="date" name="from" defaultValue={f.from} className="input" /></div>
          <div><label htmlFor="r-to" className="mb-1 block text-xs font-medium">To</label><input id="r-to" type="date" name="to" defaultValue={f.to} className="input" /></div>
        </div>
        <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-4">
          <button className="btn btn-gold">Apply filters</button>
          <Link href="/admin/registrations" className="btn btn-outline">Clear</Link>
          <a href={`/admin/registrations/export?${qs}`} className="btn btn-outline ml-auto">Download for Excel (CSV)</a>
        </div>
      </form>

      <p className="mt-4 text-sm text-muted" role="status">{res.total} matching registration{res.total === 1 ? "" : "s"}</p>
      <RegistrationsTable rows={res.rows.map((r) => ({
        id: r.id, reference: r.reference, created: formatDate(r.created_at), status: r.status, name: r.full_name, phone: r.phone,
        scholarship: r.scholarships?.title ?? "—", level: r.level, currentClass: r.current_class, district: r.district, gender: r.gender,
      }))} />

      {res.pages > 1 && (
        <nav aria-label="Pagination" className="mt-6 flex items-center justify-center gap-3">
          {res.page > 1 && <Link href={pageHref(res.page - 1)} className="btn btn-outline">Previous</Link>}
          <span className="text-sm">Page {res.page} of {res.pages}</span>
          {res.page < res.pages && <Link href={pageHref(res.page + 1)} className="btn btn-outline">Next</Link>}
        </nav>
      )}
    </>
  );
}
