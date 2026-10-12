"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { setSiteImage } from "@/app/actions/admin";
import ImageUpload from "@/components/admin/ImageUpload";

interface Props { slot: string; label: string; hint: string; width: number; current: { url: string; alt: string; path: string } | null }

export default function SiteImageEditor({ slot, label, hint, width, current }: Props) {
  const router = useRouter();
  const [path, setPath] = useState<string | null>(current?.path ?? null);
  const [preview, setPreview] = useState<string | null>(current?.url ?? null);
  const [alt, setAlt] = useState(current?.alt ?? "");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const dirty = path !== (current?.path ?? null) || alt !== (current?.alt ?? "");

  async function save() {
    setBusy(true);
    const r = await setSiteImage(slot, path, alt);
    setBusy(false);
    setMsg(r.ok ? { ok: true, text: path ? "Saved. The home page now uses this image." : "Removed. The default pattern is shown." } : { ok: false, text: r.error });
    if (r.ok) router.refresh();
  }

  return (
    <section className="card space-y-4 p-5">
      <h2 className="text-lg">{label}</h2>
      <ImageUpload id={`img-${slot}`} label="Image" folder={slot} maxWidth={width} previewUrl={preview} hint={hint}
        onChange={(p, u) => { setPath(p); setPreview(u); setMsg(null); }} />
      <div>
        <label htmlFor={`alt-${slot}`} className="mb-1 block text-sm font-medium">Short description (for screen readers)</label>
        <input id={`alt-${slot}`} className="input" value={alt} maxLength={200} onChange={(e) => setAlt(e.target.value)} placeholder="e.g. Students celebrating graduation" />
      </div>
      <div className="flex items-center gap-3">
        <button type="button" className="btn btn-gold" disabled={busy || !dirty} onClick={save}>{busy ? "Saving..." : "Save changes"}</button>
        {msg && <p role="status" className={`text-sm ${msg.ok ? "" : "text-red"}`}>{msg.text}</p>}
      </div>
    </section>
  );
}
