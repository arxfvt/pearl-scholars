"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleSaved } from "@/app/actions/student";

export default function SaveButton({ scholarshipId, initiallySaved, slug, className = "" }: { scholarshipId: string; initiallySaved: boolean; slug: string; className?: string }) {
  const router = useRouter();
  const [saved, setSaved] = useState(initiallySaved);
  const [busy, setBusy] = useState(false);

  async function click() {
    setBusy(true);
    const r = await toggleSaved(scholarshipId);
    setBusy(false);
    if (r.needsLogin) return router.push(`/login?next=${encodeURIComponent(`/scholarships/${slug}`)}`);
    if (r.ok && typeof r.saved === "boolean") setSaved(r.saved);
  }

  return (
    <button type="button" onClick={click} disabled={busy} aria-pressed={saved} className={`btn btn-outline ${className}`}>
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M6 3h12v18l-6-4-6 4Z" strokeLinejoin="round" /></svg>
      {saved ? "Saved" : "Save for later"}
    </button>
  );
}
