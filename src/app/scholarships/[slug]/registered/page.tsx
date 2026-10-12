import { Suspense } from "react";
import Link from "next/link";

export const metadata = { title: "Registration received", robots: { index: false } };

export default function Page({ searchParams }: { searchParams: Promise<{ ref?: string; missing?: string; mail?: string }> }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <Suspense fallback={null}><Content searchParams={searchParams} /></Suspense>
    </div>
  );
}

async function Content({ searchParams }: { searchParams: Promise<{ ref?: string; missing?: string; mail?: string }> }) {
  const { ref, missing, mail } = await searchParams;
  const reference = ref && /^PS-\d{2}-\d{5}$/.test(ref) ? ref : null;
  return (
    <div className="card p-8">
      <h1 className="text-3xl">Registration received</h1>
      <p className="mt-2 text-muted">Thank you. {mail ? "We have saved your registration and sent a confirmation email." : "We have saved your registration. Please keep your reference number below."}</p>
      {reference && (
        <>
          <p className="mt-6 text-sm">Your reference number</p>
          <p className="mx-auto mt-1 inline-block rounded-lg bg-gold px-5 py-2 text-2xl font-extrabold text-ink">{reference}</p>
          <p className="mt-2 text-sm text-muted">Keep it safe and quote it if you contact us.</p>
        </>
      )}
      {missing && Number(missing) > 0 && (
        <p role="alert" className="mt-5 rounded border border-red p-3 text-sm text-red">
          {missing} file{Number(missing) === 1 ? "" : "s"} could not be saved. Please contact us with your reference number to send them.
        </p>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/account" className="btn btn-gold">My registrations</Link>
        <Link href="/scholarships" className="btn btn-outline">More scholarships</Link>
      </div>
    </div>
  );
}
