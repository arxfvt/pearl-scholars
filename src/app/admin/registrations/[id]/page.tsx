import { connection } from "next/server";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { levelLabels, statusLabels, type RegistrationStatus, type StudyLevel } from "@/lib/types";
import RegistrationControls from "@/components/admin/RegistrationControls";
import { BlockSkeleton } from "@/components/Skeleton";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <>
      <Link href="/admin/registrations" className="text-sm underline">&larr; All registrations</Link>
      <Suspense fallback={<div className="mt-4"><BlockSkeleton h="h-96" /></div>}><Detail params={params} /></Suspense>
    </>
  );
}

const kampala = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Kampala" });

async function Detail({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const supabase = await createClient();
  const [{ data: r }, { data: docs }] = await Promise.all([
    supabase.from("registrations").select("*, scholarships(title,slug)").eq("id", id).maybeSingle(),
    supabase.from("registration_documents").select("id,storage_path,file_name,mime_type,size_bytes").eq("registration_id", id),
  ]);
  if (!r) notFound();

  // Short-lived signed links (10 minutes) so private documents never get a public URL.
  const links = await Promise.all((docs ?? []).map(async (d) => {
    const { data } = await supabase.storage.from("student-documents").createSignedUrl(d.storage_path, 600);
    return { ...d, url: data?.signedUrl ?? null };
  }));

  const age = r.date_of_birth ? Math.floor((Date.now() - new Date(r.date_of_birth).getTime()) / (365.25 * 86400000)) : null;
  const sch = r.scholarships as { title: string; slug: string } | null;
  const rows: [string, React.ReactNode][] = [
    ["Reference", r.reference],
    ["Submitted", kampala.format(new Date(r.created_at))],
    ["Scholarship", sch ? <Link href={`/scholarships/${sch.slug}`} target="_blank" className="underline">{sch.title}</Link> : "—"],
    ["Email", <a key="e" href={`mailto:${r.email}`} className="underline">{r.email}</a>],
    ["Phone", <a key="p" href={`tel:${r.phone}`} className="underline">{r.phone}</a>],
    ["Gender", r.gender?.replace(/_/g, " ") ?? "—"],
    ["Date of birth", r.date_of_birth ? `${r.date_of_birth}${age !== null ? ` (age ${age})` : ""}` : "—"],
    ["Level", levelLabels[r.level as StudyLevel]],
    ["Current class", r.current_class ?? "—"],
    ["School / institution", r.institution],
    ["District", r.district],
    ["Latest results", r.exam_results ?? "—"],
    ["Parent / guardian", r.guardian_name ? `${r.guardian_name}${r.guardian_phone ? `, ${r.guardian_phone}` : ""}` : "—"],
    ["Disability / special need", r.special_needs ?? "—"],
    ["Heard about us from", r.heard_from ?? "—"],
    ["Campaign (UTM)", [r.utm_source, r.utm_medium, r.utm_campaign].filter(Boolean).join(" / ") || "—"],
  ];

  return (
    <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl">{r.full_name}</h1>
          <p className="text-muted">Current status: <strong>{statusLabels[r.status as RegistrationStatus]}</strong></p>
        </div>
        <dl className="card divide-y divide-line">
          {rows.map(([k, v]) => (
            <div key={k} className="grid gap-1 p-3 sm:grid-cols-[200px_1fr]">
              <dt className="text-sm text-muted">{k}</dt><dd className="text-sm font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        <section className="card p-5">
          <h2 className="text-lg">Documents</h2>
          {links.length ? (
            <ul className="mt-3 space-y-2">
              {links.map((d) => (
                <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-line p-3 text-sm">
                  <span>{d.mime_type === "application/pdf" ? "PDF" : "Image"} · {(d.size_bytes / 1024 / 1024).toFixed(1)} MB</span>
                  {d.url ? <a href={d.url} target="_blank" rel="noopener noreferrer" className="btn btn-outline min-h-9 px-3 py-1">Open</a> : <span className="text-red">Unavailable</span>}
                </li>
              ))}
            </ul>
          ) : <p className="mt-2 text-sm text-muted">No documents uploaded.</p>}
          {links.length > 0 && <p className="mt-2 text-xs text-muted">Links expire after 10 minutes. Reload the page for fresh links.</p>}
        </section>
      </div>
      <RegistrationControls id={r.id} status={r.status} notes={r.admin_notes ?? ""} />
    </div>
  );
}
