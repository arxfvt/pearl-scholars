import { connection } from "next/server";
import { Suspense } from "react";
import Link from "next/link";
import { listScholarships, filterOptions } from "@/lib/data/scholarships";
import { levelLabels } from "@/lib/types";
import ScholarshipCard from "@/components/ScholarshipCard";
import Pagination from "@/components/Pagination";
import { CardGridSkeleton } from "@/components/Skeleton";

export const metadata = { title: "Scholarships", description: "Browse open scholarships for O-Level, A-Level, Bachelors and Postgraduate students in Uganda and East Africa." };

type SP = Promise<Record<string, string | string[] | undefined>>;

export default function Page({ searchParams }: { searchParams: SP }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
      <h1 className="text-3xl md:text-4xl">Scholarships</h1>
      <Suspense fallback={<div className="mt-6"><CardGridSkeleton count={6} /></div>}>
        <Results searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

async function Results({ searchParams }: { searchParams: SP }) {
  await connection();
  const sp = await searchParams;
  const params = { q: one(sp.q), level: one(sp.level), country: one(sp.country), field: one(sp.field), deadline: one(sp.deadline), sort: one(sp.sort) };
  const [res, opts] = await Promise.all([
    listScholarships({ ...params, sort: params.sort === "deadline" ? "deadline" : "newest", page: Number(one(sp.page)) || 1 }),
    filterOptions(),
  ]);
  const now = Date.now();
  const active = Object.values(params).some(Boolean);
  const moreActive = !!(params.country || params.field || params.deadline || params.sort === "deadline");

  return (
    <>
      <form className="card mt-5 space-y-3 p-3 sm:p-4" role="search" aria-label="Filter scholarships">
        <div className="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[2fr_1fr_auto]">
          <div className="col-span-2 sm:col-span-1">
            <label htmlFor="f-q" className="sr-only">Keyword</label>
            <input id="f-q" name="q" defaultValue={params.q} className="input" placeholder="Search, e.g. engineering" />
          </div>
          <div>
            <label htmlFor="f-level" className="sr-only">Level</label>
            <select id="f-level" name="level" defaultValue={params.level ?? ""} className="input">
              <option value="">Any level</option>
              {Object.entries(levelLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <button className="btn btn-gold">Search</button>
        </div>
        <details open={moreActive} className="group">
          <summary className="cursor-pointer select-none text-sm font-bold underline">More filters{moreActive ? " (active)" : ""}</summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Select id="f-country" name="country" label="Country" value={params.country} options={opts.countries.map((c) => [c, c])} />
            <Select id="f-field" name="field" label="Field of study" value={params.field} options={opts.fields.map((c) => [c, c])} />
            <Select id="f-deadline" name="deadline" label="Deadline" value={params.deadline} options={[["7", "Within 7 days"], ["30", "Within 30 days"], ["90", "Within 90 days"]]} />
            <div>
              <label htmlFor="f-sort" className="mb-1 block text-xs font-medium">Sort by</label>
              <select id="f-sort" name="sort" defaultValue={params.sort ?? "newest"} className="input">
                <option value="newest">Newest</option>
                <option value="deadline">Deadline</option>
              </select>
            </div>
          </div>
        </details>
        {active && <Link href="/scholarships" className="inline-block text-sm underline">Clear all filters</Link>}
      </form>

      <p className="mt-5 text-sm text-muted" role="status">{res.total} scholarship{res.total === 1 ? "" : "s"} found</p>
      {res.items.length ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {res.items.map((s) => <ScholarshipCard key={s.id} s={s} now={now} />)}
        </div>
      ) : (
        <div className="card mt-4 p-10 text-center">
          <h2 className="text-xl">No scholarships match</h2>
          <p className="mt-1 text-muted">Try removing a filter or searching a different keyword.</p>
        </div>
      )}
      <Pagination page={res.page} pages={res.pages} params={params} />
    </>
  );
}

function Select({ id, name, label, value, options }: { id: string; name: string; label: string; value?: string; options: string[][] }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-medium">{label}</label>
      <select id={id} name={name} defaultValue={value ?? ""} className="input">
        <option value="">Any</option>
        {options.map(([v, l]) => (<option key={v} value={v}>{l}</option>))}
      </select>
    </div>
  );
}
