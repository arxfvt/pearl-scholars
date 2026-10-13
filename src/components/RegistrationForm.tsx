"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { startRegistration, finishRegistration } from "@/app/actions/registration";
import { registrationSchema, MAX_FILES, MAX_FILE_BYTES, allowedMime, type RegistrationInput } from "@/lib/validation";
import { levelLabels } from "@/lib/types";
import { currentClasses, genders, heardFromOptions, ugandaDistricts } from "@/lib/uganda";
import Turnstile, { readTurnstile } from "@/components/Turnstile";

type Fields = Omit<RegistrationInput, "scholarshipId" | "utm" | "consent"> & { consent: boolean };
export interface Defaults { fullName?: string; email?: string; phone?: string; level?: string; institution?: string; district?: string }

function readUtm(): Record<string, string> | undefined {
  try {
    const raw = localStorage.getItem("ps_utm");
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

export default function RegistrationForm({ scholarshipId, slug, defaults }: { scholarshipId: string; slug: string; defaults: Defaults }) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const { register, handleSubmit, setError, formState: { errors } } = useForm<Fields>({
    defaultValues: { ...defaults, consent: false } as Partial<Fields>,
  });

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    const next = [...files, ...picked];
    if (next.length > MAX_FILES) return setFileError(`You can upload up to ${MAX_FILES} files.`);
    for (const f of picked) {
      if (!(allowedMime as readonly string[]).includes(f.type)) return setFileError(`${f.name}: only PDF, JPG or PNG files are allowed.`);
      if (f.size > MAX_FILE_BYTES) return setFileError(`${f.name} is larger than 5 MB.`);
    }
    setFileError(null);
    setFiles(next);
  }

  async function onSubmit(values: Fields, e?: React.BaseSyntheticEvent) {
    setFormError(null);
    const input = { ...values, scholarshipId, utm: readUtm() };
    const check = registrationSchema.safeParse(input);
    if (!check.success) {
      check.error.issues.forEach((i) => setError(i.path[0] as keyof Fields, { message: i.message }));
      return;
    }
    const form = e?.target as HTMLFormElement;
    setBusy("Saving your registration...");
    const start = await startRegistration(input, files.map((f) => ({ name: f.name, type: f.type, size: f.size })), form ? readTurnstile(form) : null);
    if (!start.ok) {
      setBusy(null);
      Object.entries(start.fieldErrors ?? {}).forEach(([k, message]) => setError(k as keyof Fields, { message }));
      return setFormError(start.error);
    }

    const supabase = createClient();
    const uploaded: string[] = [];
    for (let i = 0; i < files.length; i++) {
      setBusy(`Uploading file ${i + 1} of ${files.length}...`);
      const u = start.uploads[i];
      let res = await supabase.storage.from("student-documents").uploadToSignedUrl(u.path, u.token, files[i], { contentType: files[i].type });
      if (res.error) res = await supabase.storage.from("student-documents").uploadToSignedUrl(u.path, u.token, files[i], { contentType: files[i].type });
      if (!res.error) uploaded.push(u.path);
    }

    setBusy("Finishing up...");
    const done = await finishRegistration(start.registrationId, start.token, uploaded);
    const problem = files.length - (done.accepted ?? 0);
    router.push(`/scholarships/${slug}/registered?ref=${encodeURIComponent(start.reference)}${problem > 0 ? `&missing=${problem}` : ""}${done.emailed ? "&mail=1" : ""}`);
  }

  const err = (k: keyof Fields) => errors[k] && <p role="alert" className="mt-1 text-sm text-red">{errors[k]!.message as string}</p>;

  return (
    <form method="post" onSubmit={handleSubmit(onSubmit)} className="card space-y-5 p-5 md:p-6" noValidate>
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label htmlFor="fullName" className="mb-1 block text-sm font-medium">Full name</label>
          <input id="fullName" autoComplete="name" className="input" aria-invalid={!!errors.fullName} {...register("fullName")} />
          {err("fullName")}
        </div>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">Email</label>
          <input id="email" type="email" autoComplete="email" className="input" aria-invalid={!!errors.email} {...register("email")} />
          {err("email")}
        </div>
        <div>
          <label htmlFor="phone" className="mb-1 block text-sm font-medium">Phone (Uganda)</label>
          <input id="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+256 7XX XXX XXX" className="input" aria-invalid={!!errors.phone} {...register("phone")} />
          {err("phone")}
        </div>
        <div>
          <label htmlFor="level" className="mb-1 block text-sm font-medium">Level of study</label>
          <select id="level" className="input" aria-invalid={!!errors.level} {...register("level")}>
            <option value="">Choose...</option>
            {Object.entries(levelLabels).map(([v, l]) => (<option key={v} value={v}>{l}</option>))}
          </select>
          {err("level")}
        </div>
        <div>
          <label htmlFor="institution" className="mb-1 block text-sm font-medium">School or institution</label>
          <input id="institution" className="input" aria-invalid={!!errors.institution} {...register("institution")} />
          {err("institution")}
        </div>
        <div>
          <label htmlFor="district" className="mb-1 block text-sm font-medium">District</label>
          <input id="district" list="ug-districts" autoComplete="off" placeholder="Start typing, e.g. Wakiso" className="input" aria-invalid={!!errors.district} {...register("district")} />
          <datalist id="ug-districts">{ugandaDistricts.map((d) => <option key={d} value={d} />)}</datalist>
          {err("district")}
        </div>
        <div>
          <label htmlFor="gender" className="mb-1 block text-sm font-medium">Gender</label>
          <select id="gender" className="input" aria-invalid={!!errors.gender} {...register("gender")}>
            <option value="">Choose...</option>
            {genders.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>
          {err("gender")}
        </div>
        <div>
          <label htmlFor="dateOfBirth" className="mb-1 block text-sm font-medium">Date of birth</label>
          <input id="dateOfBirth" type="date" autoComplete="bday" className="input" aria-invalid={!!errors.dateOfBirth} {...register("dateOfBirth")} />
          {err("dateOfBirth")}
        </div>
        <div>
          <label htmlFor="currentClass" className="mb-1 block text-sm font-medium">Current class or year</label>
          <select id="currentClass" className="input" aria-invalid={!!errors.currentClass} {...register("currentClass")}>
            <option value="">Choose...</option>
            {currentClasses.map((g) => (
              <optgroup key={g.group} label={g.group}>{g.options.map((o) => <option key={o} value={o}>{o}</option>)}</optgroup>
            ))}
          </select>
          {err("currentClass")}
        </div>
        <div>
          <label htmlFor="examResults" className="mb-1 block text-sm font-medium">Latest results (optional)</label>
          <input id="examResults" placeholder="e.g. PLE aggregate 8, UCE 21, UACE 18 points" className="input" {...register("examResults")} />
          {err("examResults")}
        </div>
      </div>

      <fieldset className="grid gap-5 rounded-lg border border-line p-4 md:grid-cols-2">
        <legend className="px-1 text-sm font-medium">Parent or guardian <span className="font-normal text-muted">(required for O-Level and A-Level students)</span></legend>
        <div>
          <label htmlFor="guardianName" className="mb-1 block text-sm font-medium">Name</label>
          <input id="guardianName" autoComplete="off" className="input" aria-invalid={!!errors.guardianName} {...register("guardianName")} />
          {err("guardianName")}
        </div>
        <div>
          <label htmlFor="guardianPhone" className="mb-1 block text-sm font-medium">Phone</label>
          <input id="guardianPhone" type="tel" inputMode="tel" placeholder="+256 7XX XXX XXX" className="input" aria-invalid={!!errors.guardianPhone} {...register("guardianPhone")} />
          {err("guardianPhone")}
        </div>
      </fieldset>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label htmlFor="specialNeeds" className="mb-1 block text-sm font-medium">Disability or special need (optional)</label>
          <input id="specialNeeds" placeholder="Tell us if you need any support" className="input" {...register("specialNeeds")} />
        </div>
        <div>
          <label htmlFor="heardFrom" className="mb-1 block text-sm font-medium">How did you hear about us? (optional)</label>
          <select id="heardFrom" className="input" {...register("heardFrom")}>
            <option value="">Choose...</option>
            {heardFromOptions.map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Documents (optional)</legend>
        <p className="text-sm text-muted">Report cards, certificates, ID. PDF, JPG or PNG, up to 5 MB each, maximum {MAX_FILES} files.</p>
        <input id="files" type="file" multiple accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={onPick} className="input" aria-describedby="file-help" />
        <p id="file-help" className="sr-only">Choose up to five files</p>
        {fileError && <p role="alert" className="text-sm text-red">{fileError}</p>}
        {files.length > 0 && (
          <ul className="space-y-1 text-sm">
            {files.map((f, i) => (
              <li key={`${f.name}-${i}`} className="flex items-center justify-between rounded border border-line px-3 py-1.5">
                <span className="truncate">{f.name} <span className="text-muted">({(f.size / 1024 / 1024).toFixed(1)} MB)</span></span>
                <button type="button" className="ml-3 text-sm underline" onClick={() => setFiles(files.filter((_, j) => j !== i))}>Remove</button>
              </li>
            ))}
          </ul>
        )}
      </fieldset>

      <div>
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-ink" {...register("consent")} />
          <span>I agree that Pearl Scholars may collect and process my personal data and documents to handle this registration, in line with the Uganda Data Protection and Privacy Act, 2019 and the <a href="/privacy" target="_blank" className="underline">Privacy Policy</a>.</span>
        </label>
        {err("consent")}
      </div>

      <Turnstile />
      {formError && <p role="alert" className="rounded border border-red p-3 text-sm text-red">{formError}</p>}
      <button disabled={!!busy} className="btn btn-gold w-full md:w-auto">{busy ?? "Submit registration"}</button>
    </form>
  );
}
