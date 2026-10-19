import { Suspense } from "react";
import { getFaq } from "@/lib/data/content";
import { BlockSkeleton } from "@/components/Skeleton";

export const metadata = { title: "FAQ", description: "Answers to common questions about Pearl Scholars." , alternates: { canonical: "/faq" } };

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl md:text-4xl">Frequently asked questions</h1>
      <Suspense fallback={<div className="mt-6"><BlockSkeleton /></div>}><List /></Suspense>
    </div>
  );
}

async function List() {
  const faq = await getFaq();
  if (!faq.length) return <p className="mt-6 text-muted">No questions yet.</p>;
  return (
    <div className="mt-6 space-y-2">
      {faq.map((f) => (
        <details key={f.q} className="card p-4">
          <summary className="cursor-pointer font-bold">{f.q}</summary>
          <p className="mt-2 text-muted">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
