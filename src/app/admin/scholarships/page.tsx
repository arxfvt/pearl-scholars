import { connection } from "next/server";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { coverFor } from "@/lib/data/content";
import { displayStatus } from "@/lib/data/scholarships";
import { formatDate } from "@/lib/format";
import type { Scholarship } from "@/lib/types";
import RowActions from "@/components/admin/RowActions";
import { BlockSkeleton } from "@/components/Skeleton";

export default function Page({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl">Scholarships</h1>
        <Link href="/admin/scholarships/new" className="btn btn-gold">Add scholarship</Link>
      </div>
      <Suspense fallback={<div className="mt-6"><BlockSkeleton h="h-96" /></div>}><List searchParams={searchParams} /></Suspense>
    </>
  );
}

const statusLabel = { draft: "Draft", published: "Published", closed: "Closed" } as const;

async function List({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  await connection();
  const { saved } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("scholarships")
    .select("id,slug,title,provider,status,deadline,featured,levels,cover_image_path,is_sample")
    .order("updated_at", { ascending: false });
  const rows = (data ?? []) as (Scholarship & { is_sample: boolean })[];
  const now = Date.now();

  return (
    <>
      {saved && <p role="status" className="card mt-4 border-l-4 p-3 text-sm">Saved{saved === "published" ? " and published" : " as draft"}.</p>}
      {rows.length === 0 ? (
        <div className="card mt-6 p-10 text-center">
          <p className="text-muted">No scholarships yet.</p>
          <Link href="/admin/scholarships/new" className="btn btn-gold mt-4">Add your first scholarship</Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map((s) => {
            const expired = s.status === "published" && displayStatus(s, now) === "closed";
            return (
              <li key={s.id} className="card flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
                <div className="relative aspect-[16/7] w-full shrink-0 overflow-hidden rounded bg-ink sm:w-40">
                  <Image src={coverFor(s)} alt="" fill sizes="160px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={`rounded px-2 py-0.5 font-bold ${s.status === "published" ? "bg-ink text-white" : "bg-line"}`}>{statusLabel[s.status]}</span>
                    {expired && <span className="rounded bg-red px-2 py-0.5 font-bold text-white">Deadline passed</span>}
                    {s.featured && <span className="rounded bg-gold px-2 py-0.5 font-bold text-ink">Featured</span>}
                    {s.is_sample && <span className="rounded border border-line px-2 py-0.5">Sample</span>}
                  </div>
                  <p className="truncate font-bold">{s.title}</p>
                  <p className="text-sm text-muted">{s.provider} · Deadline {formatDate(s.deadline)}</p>
                  <RowActions id={s.id} slug={s.slug} status={s.status} title={s.title} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
