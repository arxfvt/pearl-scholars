"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveTestimonial, deleteTestimonial } from "@/app/actions/admin";
import ImageUpload from "@/components/admin/ImageUpload";

export interface TestimonialValues {
  name: string; scholarship_won: string; school: string; quote: string; photo_path: string | null;
  video_url: string; approved: boolean; sort_order: number;
}

export const emptyTestimonial: TestimonialValues = { name: "", scholarship_won: "", school: "", quote: "", photo_path: null, video_url: "", approved: true, sort_order: 0 };

export default function TestimonialForm({ id, initial, photoUrl }: { id: string | null; initial: TestimonialValues; photoUrl: string | null }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [preview, setPreview] = useState(photoUrl);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof TestimonialValues>(k: K, val: TestimonialValues[K]) => setV((p) => ({ ...p, [k]: val }));

  async function save() {
    setBusy(true); setMsg(null); setErrors({});
    const r = await saveTestimonial(id, v);
    setBusy(false);
    if (!r.ok) { setErrors(r.fieldErrors ?? {}); return setMsg(r.error); }
    router.push("/admin/testimonials?saved=1");
    router.refresh();
  }
  async function remove() {
    if (!id || !confirm(`Delete the story from ${v.name}? This cannot be undone.`)) return;
    setBusy(true);
    const r = await deleteTestimonial(id);
    setBusy(false);
    if (!r.ok) return setMsg(r.error);
    router.push("/admin/testimonials");
    router.refresh();
  }

  const field = (k: "name" | "scholarship_won" | "school" | "video_url", label: string, required = false, placeholder?: string) => (
    <div>
      <label htmlFor={`t-${k}`} className="mb-1 block text-sm font-medium">{label}{required && <span className="text-red"> *</span>}</label>
      <input id={`t-${k}`} className="input" placeholder={placeholder} value={v[k]} onChange={(e) => set(k, e.target.value)} aria-invalid={!!errors[k]} />
      {errors[k] && <p role="alert" className="mt-1 text-sm text-red">{errors[k]}</p>}
    </div>
  );

  return (
    <form method="post" onSubmit={(e) => { e.preventDefault(); save(); }} className="space-y-6" noValidate>
      {msg && <p role="alert" className="rounded border border-red bg-surface p-3 text-sm text-red">{msg}</p>}
      <section className="card space-y-4 p-5">
        <div className="grid gap-4 md:grid-cols-2">
          {field("name", "Student's name", true)}
          {field("scholarship_won", "Scholarship won", true)}
          {field("school", "School or university")}
          {field("video_url", "Video link (optional)", false, "https://")}
        </div>
        <div>
          <label htmlFor="t-quote" className="mb-1 block text-sm font-medium">Their story, in their words <span className="text-red">*</span></label>
          <textarea id="t-quote" rows={5} className="input" value={v.quote} onChange={(e) => set("quote", e.target.value)} aria-invalid={!!errors.quote} />
          {errors.quote && <p role="alert" className="mt-1 text-sm text-red">{errors.quote}</p>}
        </div>
      </section>
      <section className="card p-5">
        <ImageUpload id="t-photo" label="Photo" folder="testimonials" maxWidth={600} previewUrl={preview} aspect="aspect-square max-w-48"
          hint="A clear photo of the student (with their permission). It is cropped to a circle on the site."
          onChange={(p, u) => { set("photo_path", p); setPreview(u); }} />
      </section>
      <section className="card flex flex-wrap items-center gap-4 p-5">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" className="h-5 w-5 accent-ink" checked={v.approved} onChange={(e) => set("approved", e.target.checked)} />
          Show on the website
        </label>
        <label className="flex items-center gap-2 text-sm">
          Order <input type="number" min={0} max={9999} className="input w-24" value={v.sort_order} onChange={(e) => set("sort_order", Number(e.target.value) || 0)} />
          <span className="text-xs text-muted">(lower shows first)</span>
        </label>
        <div className="ml-auto flex gap-2">
          {id && <button type="button" onClick={remove} disabled={busy} className="btn btn-outline text-red">Delete</button>}
          <button disabled={busy} className="btn btn-gold">{busy ? "Saving..." : "Save story"}</button>
        </div>
      </section>
    </form>
  );
}
