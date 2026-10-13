"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveScholarship } from "@/app/actions/admin";
import { levelLabels, type StudyLevel, type PublishStatus } from "@/lib/types";
import ImageUpload from "@/components/admin/ImageUpload";

export interface ScholarshipFormValues {
  title: string; slug: string; provider: string; provider_url: string; provider_hidden: boolean; video_url: string; country: string;
  summary: string; description: string; eligibility: string; benefits: string; required_documents: string;
  amount_text: string; levels: StudyLevel[]; fields: string; tags: string;
  cover_image_path: string | null; deadline: string; featured: boolean; status: PublishStatus;
}

export const emptyScholarship: ScholarshipFormValues = {
  title: "", slug: "", provider: "", provider_url: "", provider_hidden: false, video_url: "", country: "Uganda", summary: "", description: "", eligibility: "",
  benefits: "", required_documents: "", amount_text: "", levels: [], fields: "", tags: "", cover_image_path: null,
  deadline: "", featured: false, status: "draft",
};

export default function ScholarshipForm({ id, initial, coverUrl }: { id: string | null; initial: ScholarshipFormValues; coverUrl: string | null }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [preview, setPreview] = useState(coverUrl);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof ScholarshipFormValues>(k: K, val: ScholarshipFormValues[K]) => setV((p) => ({ ...p, [k]: val }));

  async function submit(status: PublishStatus) {
    setBusy(true);
    setFormError(null);
    setErrors({});
    const res = await saveScholarship(id, { ...v, status });
    setBusy(false);
    if (!res.ok) {
      setErrors(res.fieldErrors ?? {});
      setFormError(res.error);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    router.push(`/admin/scholarships?saved=${status}`);
    router.refresh();
  }

  const text = (k: keyof ScholarshipFormValues, label: string, opts: { required?: boolean; placeholder?: string; type?: string; help?: string } = {}) => (
    <div>
      <label htmlFor={`f-${k}`} className="mb-1 block text-sm font-medium">{label}{opts.required && <span className="text-red"> *</span>}</label>
      <input id={`f-${k}`} type={opts.type ?? "text"} className="input" placeholder={opts.placeholder} value={v[k] as string} onChange={(e) => set(k, e.target.value as never)} aria-invalid={!!errors[k]} />
      {opts.help && <p className="mt-1 text-xs text-muted">{opts.help}</p>}
      {errors[k] && <p role="alert" className="mt-1 text-sm text-red">{errors[k]}</p>}
    </div>
  );
  const area = (k: keyof ScholarshipFormValues, label: string, rows = 5, help?: string) => (
    <div>
      <label htmlFor={`f-${k}`} className="mb-1 block text-sm font-medium">{label}</label>
      <textarea id={`f-${k}`} rows={rows} className="input" value={v[k] as string} onChange={(e) => set(k, e.target.value as never)} />
      {help && <p className="mt-1 text-xs text-muted">{help}</p>}
      {errors[k] && <p role="alert" className="mt-1 text-sm text-red">{errors[k]}</p>}
    </div>
  );

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(v.status); }} className="space-y-6" noValidate>
      {formError && <p role="alert" className="rounded border border-red bg-surface p-3 text-sm text-red">{formError}</p>}

      <section className="card space-y-4 p-5">
        <h2 className="text-lg">Basics</h2>
        {text("title", "Title", { required: true, placeholder: "e.g. Mastercard Foundation Scholars Program 2027" })}
        <div className="grid gap-4 md:grid-cols-2">
          {text("provider", "Provider", { required: true })}
          {text("provider_url", "Provider website (optional)", { type: "url", placeholder: "https://", help: "Leave empty if the provider has no website or prefers not to share it." })}
          {text("country", "Country of study", { required: true })}
          {text("amount_text", "Value or coverage", { placeholder: "e.g. Full tuition + stipend" })}
          {text("deadline", "Deadline (Kampala time)", { type: "datetime-local", help: "After this time the scholarship shows as closed automatically." })}
          {text("slug", "Web address (optional)", { placeholder: "made from the title if left empty" })}
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-0.5 h-5 w-5 accent-ink" checked={v.provider_hidden} onChange={(e) => set("provider_hidden", e.target.checked)} />
          <span><strong>Private sponsor.</strong> Hide the provider&rsquo;s name and website from the public. Students will see &ldquo;Private sponsor&rdquo;. You still see the real name here.</span>
        </label>
        <fieldset>
          <legend className="mb-1 text-sm font-medium">Levels of study <span className="text-red">*</span></legend>
          <div className="flex flex-wrap gap-4">
            {(Object.keys(levelLabels) as StudyLevel[]).map((l) => (
              <label key={l} className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="h-5 w-5 accent-ink" checked={v.levels.includes(l)} onChange={(e) => set("levels", e.target.checked ? [...v.levels, l] : v.levels.filter((x) => x !== l))} />
                {levelLabels[l]}
              </label>
            ))}
          </div>
          {errors.levels && <p role="alert" className="mt-1 text-sm text-red">{errors.levels}</p>}
        </fieldset>
        <div className="grid gap-4 md:grid-cols-2">
          {text("fields", "Fields of study", { placeholder: "Science, Engineering", help: "Separate with commas." })}
          {text("tags", "Tags", { placeholder: "stem, girls-in-science", help: "Separate with commas." })}
        </div>
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="text-lg">Cover image</h2>
        <ImageUpload id="cover" label="Cover photo" folder="covers" maxWidth={1600} previewUrl={preview}
          hint="Wide photos work best. It is resized and compressed automatically. Without one, a generic image for the level is shown."
          onChange={(path, url) => { set("cover_image_path", path); setPreview(url); }} />
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="text-lg">Video advert</h2>
        {text("video_url", "Video link (optional)", { type: "url", placeholder: "https://www.youtube.com/watch?v=...", help: "YouTube videos play on the scholarship page (they only load when tapped, to save students' data). TikTok or Facebook links show a 'Watch video' button." })}
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="text-lg">Details</h2>
        {area("summary", "Short summary", 2, "One or two sentences shown on cards (max 300 characters).")}
        {area("description", "Description", 8, "Plain text. Leave an empty line between paragraphs. Start lines with \"- \" for a bullet list.")}
        {area("eligibility", "Eligibility", 5, "Keep criteria fair and neutral. Only include restrictions the provider actually sets.")}
        {area("benefits", "Benefits", 4)}
        {area("required_documents", "Required documents", 4)}
      </section>

      <section className="card flex flex-wrap items-center gap-4 p-5">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" className="h-5 w-5 accent-ink" checked={v.featured} onChange={(e) => set("featured", e.target.checked)} />
          Feature on the home page
        </label>
        <div className="ml-auto flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={() => submit("draft")} className="btn btn-outline">Save as draft</button>
          <button type="button" disabled={busy} onClick={() => submit("published")} className="btn btn-gold">{busy ? "Saving..." : "Publish"}</button>
        </div>
      </section>
    </form>
  );
}
