import { Suspense } from "react";
import { getTestimonials } from "@/lib/data/content";
import StoryCard from "@/components/StoryCard";
import AdminShortcut from "@/components/AdminShortcut";
import { BlockSkeleton } from "@/components/Skeleton";

export const metadata = { title: "Success stories", description: "Hear from students who won scholarships through Pearl Scholars." };

export default function Page() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
      <AdminShortcut links={[{ href: "/admin/testimonials", label: "Edit success stories" }, { href: "/admin/testimonials/new", label: "Add a story" }]} />
      <h1 className="text-3xl md:text-4xl">Success stories</h1>
      <p className="mt-2 text-muted">Real students. Real Fursa.</p>
      <Suspense fallback={<div className="mt-6"><BlockSkeleton /></div>}><List /></Suspense>
    </div>
  );
}

async function List() {
  const items = await getTestimonials();
  if (!items.length) return <div className="card mt-6 p-10 text-center text-muted">Success stories will appear here soon.</div>;
  return (
    <ul className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((t) => <li key={t.id}><StoryCard t={t} /></li>)}
    </ul>
  );
}
