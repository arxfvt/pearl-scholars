import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { publicImageUrl } from "@/lib/data/content";
import ScholarshipForm, { type ScholarshipFormValues } from "@/components/admin/ScholarshipForm";
import { BlockSkeleton } from "@/components/Skeleton";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <>
      <Link href="/admin/scholarships" className="text-sm underline">&larr; All scholarships</Link>
      <h1 className="mb-6 mt-2 text-3xl">Edit scholarship</h1>
      <Suspense fallback={<BlockSkeleton h="h-96" />}><Editor params={params} /></Suspense>
    </>
  );
}

/** ISO timestamp -> "YYYY-MM-DDTHH:mm" in Kampala time (UTC+3). */
const toKampalaLocal = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() + 3 * 3600_000).toISOString().slice(0, 16) : "");

async function Editor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const supabase = await createClient();
  const { data: s } = await supabase.from("scholarships").select("*").eq("id", id).maybeSingle();
  if (!s) notFound();

  const initial: ScholarshipFormValues = {
    title: s.title, slug: s.slug, provider: s.provider, provider_url: s.provider_url ?? "", provider_hidden: s.provider_hidden ?? false, video_url: s.video_url ?? "", country: s.country,
    summary: s.summary ?? "", description: s.description ?? "", eligibility: s.eligibility ?? "", benefits: s.benefits ?? "",
    required_documents: s.required_documents ?? "", amount_text: s.amount_text ?? "", levels: s.levels ?? [],
    fields: (s.fields ?? []).join(", "), tags: (s.tags ?? []).join(", "), cover_image_path: s.cover_image_path,
    deadline: toKampalaLocal(s.deadline), featured: s.featured, status: s.status,
  };
  return <ScholarshipForm id={s.id} initial={initial} coverUrl={publicImageUrl(s.cover_image_path)} />;
}
