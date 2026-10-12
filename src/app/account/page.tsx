import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAdmin } from "@/lib/auth";
import { statusLabels, type RegistrationStatus } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { BlockSkeleton } from "@/components/Skeleton";

export const metadata = { title: "My registrations", robots: { index: false } };

export default function Page() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Suspense fallback={<BlockSkeleton h="h-80" />}><Content /></Suspense>
    </div>
  );
}

async function Content() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <p>Please <Link href="/login?next=/account" className="font-bold underline">log in</Link>.</p>;
  const [admin, { data: regs }] = await Promise.all([
    getAdmin(),
    supabase.from("registrations").select("id,reference,status,created_at,scholarships(title,slug)").order("created_at", { ascending: false }),
  ]);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl">My registrations</h1>
          <p className="text-sm text-muted">{user.email}</p>
        </div>
        <div className="flex gap-2">
          {admin && <Link href="/admin" className="btn btn-gold">Admin dashboard</Link>}
          <form action="/auth/signout" method="post"><button className="btn btn-outline">Log out</button></form>
        </div>
      </div>

      {!regs?.length ? (
        <div className="card mt-6 p-8 text-center">
          <p className="text-muted">You have not registered for any scholarship yet.</p>
          <Link href="/scholarships" className="btn btn-gold mt-4">Browse scholarships</Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {regs.map((r) => {
            const s = r.scholarships as unknown as { title: string; slug: string } | null;
            return (
              <li key={r.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-bold">{s ? <Link href={`/scholarships/${s.slug}`} className="hover:underline">{s.title}</Link> : "Scholarship"}</p>
                  <p className="text-sm text-muted">{r.reference} · {formatDate(r.created_at)}</p>
                </div>
                <span className="rounded-full bg-ink px-3 py-1 text-xs font-bold text-white">{statusLabels[r.status as RegistrationStatus]}</span>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
