import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { publicImageUrl } from "@/lib/data/content";
import TestimonialForm from "@/components/admin/TestimonialForm";
import { BlockSkeleton } from "@/components/Skeleton";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <>
      <Link href="/admin/testimonials" className="text-sm underline">&larr; All stories</Link>
      <h1 className="mb-6 mt-2 text-3xl">Edit success story</h1>
      <Suspense fallback={<BlockSkeleton h="h-96" />}><Editor params={params} /></Suspense>
    </>
  );
}

async function Editor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const supabase = await createClient();
  const { data: t } = await supabase.from("testimonials").select("*").eq("id", id).maybeSingle();
  if (!t) notFound();
  return (
    <TestimonialForm
      id={t.id}
      initial={{ name: t.name, scholarship_won: t.scholarship_won, school: t.school ?? "", quote: t.quote, photo_path: t.photo_path, video_url: t.video_url ?? "", approved: t.approved, sort_order: t.sort_order }}
      photoUrl={publicImageUrl(t.photo_path)}
    />
  );
}
