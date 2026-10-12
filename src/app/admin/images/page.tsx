import { Suspense } from "react";
import { getSiteImage, SITE_IMAGE_SLOTS, type SiteImageSlot } from "@/lib/data/content";
import SiteImageEditor from "@/components/admin/SiteImageEditor";
import { BlockSkeleton } from "@/components/Skeleton";

export default function Page() {
  return (
    <>
      <h1 className="text-3xl">Site images</h1>
      <p className="mt-1 text-muted">Upload photos for the website. They are resized and compressed automatically. A dark overlay keeps text readable.</p>
      <div className="mt-6 space-y-6">
        <Suspense fallback={<BlockSkeleton h="h-80" />}><Editors /></Suspense>
      </div>
    </>
  );
}

async function Editors() {
  const slots = Object.entries(SITE_IMAGE_SLOTS) as [SiteImageSlot, (typeof SITE_IMAGE_SLOTS)[SiteImageSlot]][];
  const current = await Promise.all(slots.map(([slot]) => getSiteImage(slot)));
  return (
    <>
      {slots.map(([slot, cfg], i) => (
        <SiteImageEditor key={slot} slot={slot} label={cfg.label} hint={cfg.hint} width={cfg.width} current={current[i]} />
      ))}
    </>
  );
}
