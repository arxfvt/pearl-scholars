"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/** Resize to maxWidth and re-encode as WebP in the browser, so uploads stay small on slow connections. */
async function compress(file: File, maxWidth: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not process image"))), "image/webp", 0.82));
}

interface Props {
  id: string;
  label: string;
  folder: string;
  maxWidth: number;
  previewUrl: string | null;
  aspect?: string;
  hint?: string;
  onChange: (path: string | null, previewUrl: string | null) => void;
}

export default function ImageUpload({ id, label, folder, maxWidth, previewUrl, aspect = "aspect-[16/7]", hint, onChange }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return setError("Use a JPG, PNG or WebP image.");
    if (file.size > 15 * 1024 * 1024) return setError("That image is over 15 MB. Pick a smaller one.");
    setError(null);
    setBusy(true);
    try {
      const blob = await compress(file, maxWidth);
      const path = `${folder}/${crypto.randomUUID()}.webp`;
      const { error: upErr } = await createClient().storage.from("site-images").upload(path, blob, { contentType: "image/webp", cacheControl: "31536000" });
      if (upErr) throw upErr;
      onChange(path, URL.createObjectURL(blob));
    } catch {
      setError("Upload failed. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium">{label}</span>
      {hint && <p className="text-xs text-muted">{hint}</p>}
      <div className={`relative ${aspect} w-full overflow-hidden rounded-lg border border-line bg-ink`}>
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-sm text-white/70">No image yet: a generic image is shown</span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={id} className="btn btn-gold cursor-pointer">{busy ? "Uploading..." : previewUrl ? "Replace image" : "Upload image"}</label>
        <input id={id} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={onPick} disabled={busy} />
        {previewUrl && !busy && <button type="button" className="btn btn-outline" onClick={() => onChange(null, null)}>Remove</button>}
      </div>
      {error && <p role="alert" className="text-sm text-red">{error}</p>}
    </div>
  );
}
