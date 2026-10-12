import { Suspense } from "react";
import Image from "next/image";
import { getTestimonials, publicImageUrl } from "@/lib/data/content";
import { BlockSkeleton } from "@/components/Skeleton";

export const metadata = { title: "Success stories", description: "Hear from students who won scholarships through Pearl Scholars." };

export default function Page() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
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
    <ul className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {items.map((t) => {
        const photo = publicImageUrl(t.photo_path);
        return (
          <li key={t.id} className="card flex flex-col p-5">
            <blockquote className="flex-1">&ldquo;{t.quote}&rdquo;</blockquote>
            <div className="mt-4 flex items-center gap-3">
              {photo ? <Image src={photo} alt={`Photo of ${t.name}`} width={48} height={48} className="h-12 w-12 rounded-full object-cover" /> : <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink font-extrabold text-gold" aria-hidden>{t.name.replace("[SAMPLE] ", "").charAt(0)}</span>}
              <p className="text-sm"><strong>{t.name}</strong><br />{t.scholarship_won}{t.school ? `, ${t.school}` : ""}</p>
            </div>
            {t.video_url && /^https:\/\//.test(t.video_url) && <a href={t.video_url} target="_blank" rel="noopener noreferrer" className="mt-3 text-sm font-bold underline">Watch video</a>}
          </li>
        );
      })}
    </ul>
  );
}
