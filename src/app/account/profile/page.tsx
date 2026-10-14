import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProfileForm from "@/components/student/ProfileForm";
import { BlockSkeleton } from "@/components/Skeleton";

export const metadata = { title: "My profile", robots: { index: false } };

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:py-10">
      <Link href="/account" className="text-sm underline">&larr; My dashboard</Link>
      <h1 className="mb-1 mt-2 text-3xl">My profile</h1>
      <p className="mb-5 text-sm text-muted">Save your details once and every registration form fills itself in.</p>
      <Suspense fallback={<BlockSkeleton h="h-96" />}><Form /></Suspense>
    </div>
  );
}

async function Form() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <p>Please <Link href="/login?next=/account/profile" className="font-bold underline">log in</Link>.</p>;
  const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  const s = (v: unknown) => (typeof v === "string" ? v : "");
  return (
    <ProfileForm email={user.email ?? ""} initial={{
      full_name: s(p?.full_name) || s(user.user_metadata?.full_name), phone: s(p?.phone), level: s(p?.level), institution: s(p?.institution),
      district: s(p?.district), gender: s(p?.gender), date_of_birth: s(p?.date_of_birth), current_class: s(p?.current_class),
      exam_results: s(p?.exam_results), guardian_name: s(p?.guardian_name), guardian_phone: s(p?.guardian_phone), alerts_opt_in: !!p?.alerts_opt_in,
    }} />
  );
}
