"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setScholarshipStatus, duplicateScholarship, deleteScholarship, type AdminResult } from "@/app/actions/admin";
import type { PublishStatus } from "@/lib/types";

export default function RowActions({ id, slug, status, title }: { id: string; slug: string; status: PublishStatus; title: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(fn: () => Promise<AdminResult>, after?: (r: AdminResult) => void) {
    setBusy(true);
    setError(null);
    const r = await fn();
    setBusy(false);
    if (!r.ok) return setError(r.error);
    after?.(r);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      <Link href={`/admin/scholarships/${id}`} className="font-bold underline">Edit</Link>
      {status !== "draft" && <Link href={`/scholarships/${slug}`} target="_blank" className="underline">View</Link>}
      {status !== "published" && <button disabled={busy} className="underline" onClick={() => run(() => setScholarshipStatus(id, "published"))}>Publish</button>}
      {status === "published" && <button disabled={busy} className="underline" onClick={() => run(() => setScholarshipStatus(id, "closed"))}>Close</button>}
      {status === "published" && <button disabled={busy} className="underline" onClick={() => run(() => setScholarshipStatus(id, "draft"))}>Unpublish</button>}
      <button disabled={busy} className="underline" onClick={() => run(() => duplicateScholarship(id), (r) => r.ok && r.id && router.push(`/admin/scholarships/${r.id}`))}>Duplicate</button>
      <button disabled={busy} className="text-red underline" onClick={() => confirm(`Delete "${title}"? This cannot be undone.`) && run(() => deleteScholarship(id))}>Delete</button>
      {error && <p role="alert" className="w-full text-red">{error}</p>}
    </div>
  );
}
