import { connection } from "next/server";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getScholarshipBySlug, displayStatus } from "@/lib/data/scholarships";
import { createClient } from "@/lib/supabase/server";
import RegistrationForm from "@/components/RegistrationForm";
import { BlockSkeleton } from "@/components/Skeleton";

export const metadata = { title: "Register", robots: { index: false } };

export default function Page({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Suspense fallback={<BlockSkeleton h="h-96" />}><Content params={params} /></Suspense>
    </div>
  );
}

async function Content({ params }: { params: Promise<{ slug: string }> }) {
  await connection();
  const { slug } = await params;
  const s = await getScholarshipBySlug(slug);
  if (!s) notFound();

  if (displayStatus(s, Date.now()) === "closed")
    return (
      <div className="card p-8 text-center">
        <h1 className="text-2xl">Applications are closed</h1>
        <p className="mt-2 text-muted">{s.title} is no longer accepting registrations.</p>
        <Link href="/scholarships" className="btn btn-gold mt-5">Find other scholarships</Link>
      </div>
    );

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: p } = user ? await supabase.from("profiles").select("full_name,email,phone,level,institution,district").eq("id", user.id).maybeSingle() : { data: null };

  return (
    <>
      <Link href={`/scholarships/${s.slug}`} className="text-sm underline">&larr; Back to scholarship</Link>
      <h1 className="mt-3 text-3xl">Register</h1>
      <p className="mb-6 text-muted">{s.title}</p>
      {!user && (
        <p className="card mb-5 p-4 text-sm">Have an account? <Link href={`/login?next=/scholarships/${s.slug}/register`} className="font-bold underline">Log in</Link> to autofill your details and track this registration.</p>
      )}
      <RegistrationForm
        scholarshipId={s.id}
        slug={s.slug}
        defaults={{ fullName: p?.full_name ?? "", email: p?.email ?? user?.email ?? "", phone: p?.phone ?? "", level: p?.level ?? "", institution: p?.institution ?? "", district: p?.district ?? "" }}
      />
    </>
  );
}
