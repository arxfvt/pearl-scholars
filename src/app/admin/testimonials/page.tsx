import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { avatarFor } from "@/lib/data/content";
import { BlockSkeleton } from "@/components/Skeleton";

export default function Page({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl">Success stories</h1>
          <p className="text-sm text-muted">Stories marked &ldquo;Shown&rdquo; appear on the Success stories page and the home page.</p>
        </div>
        <Link href="/admin/testimonials/new" className="btn btn-gold">Add story</Link>
      </div>
      <Suspense fallback={<div className="mt-6"><BlockSkeleton /></div>}><List searchParams={searchParams} /></Suspense>
    </>
  );
}

async function List({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { saved } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("testimonials").select("id,name,scholarship_won,school,photo_path,approved,sort_order,is_sample").order("sort_order").order("created_at", { ascending: false });
  const rows = data ?? [];
  return (
    <>
      {saved && <p role="status" className="card mt-4 p-3 text-sm">Story saved.</p>}
      {!rows.length ? (
        <div className="card mt-6 p-10 text-center text-muted">No stories yet.</div>
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map((t) => {
            const avatar = avatarFor(t);
            return (
              <li key={t.id} className="card flex flex-wrap items-center gap-3 p-3 sm:flex-nowrap sm:gap-4">
                <Image src={avatar.src} alt="" width={56} height={56} className="h-14 w-14 rounded-full border-2 border-gold object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{t.name}</p>
                  <p className="truncate text-sm text-muted">{t.scholarship_won}{t.school ? ` · ${t.school}` : ""}</p>
                </div>
                <span className={`rounded px-2 py-0.5 text-xs font-bold ${t.approved ? "bg-ink text-white" : "bg-line"}`}>{t.approved ? "Shown" : "Hidden"}</span>
                {t.is_sample && <span className="rounded border border-line px-2 py-0.5 text-xs">Sample</span>}
                <Link href={`/admin/testimonials/${t.id}`} className="btn btn-gold min-h-9 px-4 py-1 text-sm">Edit{avatar.isPhoto ? "" : " / add photo"}</Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
