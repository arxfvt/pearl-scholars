"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/app/actions/student";
import { levelLabels } from "@/lib/types";
import { currentClasses, genders, ugandaDistricts } from "@/lib/uganda";

export interface ProfileValues {
  full_name: string; phone: string; level: string; institution: string; district: string; gender: string; date_of_birth: string;
  current_class: string; exam_results: string; guardian_name: string; guardian_phone: string; alerts_opt_in: boolean;
}

export default function ProfileForm({ initial, email }: { initial: ProfileValues; email: string }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof ProfileValues, val: string | boolean) => setV((p) => ({ ...p, [k]: val }));
  const secondary = v.level === "o_level" || v.level === "a_level";

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErrors({}); setMsg(null);
    const r = await updateProfile(v);
    setBusy(false);
    if (!r.ok) { setErrors(r.fieldErrors ?? {}); setMsg({ ok: false, text: r.error }); return; }
    setMsg({ ok: true, text: "Profile saved. Your details will be filled in automatically when you register." });
    router.refresh();
  }

  const input = (k: keyof ProfileValues, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={`p-${k}`} className="mb-1 block text-sm font-medium">{label}</label>
      <input id={`p-${k}`} className="input" value={v[k] as string} onChange={(e) => set(k, e.target.value)} aria-invalid={!!errors[k]} {...props} />
      {errors[k] && <p role="alert" className="mt-1 text-sm text-red">{errors[k]}</p>}
    </div>
  );

  return (
    <form method="post" onSubmit={save} className="space-y-5" noValidate>
      {msg && <p role={msg.ok ? "status" : "alert"} className={`rounded-lg border p-3 text-sm ${msg.ok ? "border-ink bg-surface" : "border-red text-red"}`}>{msg.text}</p>}

      <section className="card space-y-4 p-4 sm:p-5">
        <h2 className="text-lg">About you</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {input("full_name", "Full name", { autoComplete: "name" })}
          <div><span className="mb-1 block text-sm font-medium">Email</span><p className="input flex items-center bg-ivory text-muted">{email}</p></div>
          {input("phone", "Phone (Uganda)", { type: "tel", inputMode: "tel", placeholder: "+256 7XX XXX XXX", autoComplete: "tel" })}
          <div>
            <label htmlFor="p-gender" className="mb-1 block text-sm font-medium">Gender</label>
            <select id="p-gender" className="input" value={v.gender} onChange={(e) => set("gender", e.target.value)}>
              <option value="">Choose...</option>
              {genders.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </div>
          {input("date_of_birth", "Date of birth", { type: "date", autoComplete: "bday" })}
          <div>
            <label htmlFor="p-district" className="mb-1 block text-sm font-medium">District</label>
            <input id="p-district" list="p-districts" className="input" value={v.district} onChange={(e) => set("district", e.target.value)} placeholder="e.g. Wakiso" />
            <datalist id="p-districts">{ugandaDistricts.map((d) => <option key={d} value={d} />)}</datalist>
          </div>
        </div>
      </section>

      <section className="card space-y-4 p-4 sm:p-5">
        <h2 className="text-lg">Your studies</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="p-level" className="mb-1 block text-sm font-medium">Level of study</label>
            <select id="p-level" className="input" value={v.level} onChange={(e) => set("level", e.target.value)}>
              <option value="">Choose...</option>
              {Object.entries(levelLabels).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="p-class" className="mb-1 block text-sm font-medium">Current class or year</label>
            <select id="p-class" className="input" value={v.current_class} onChange={(e) => set("current_class", e.target.value)}>
              <option value="">Choose...</option>
              {currentClasses.map((g) => <optgroup key={g.group} label={g.group}>{g.options.map((o) => <option key={o} value={o}>{o}</option>)}</optgroup>)}
            </select>
          </div>
          {input("institution", "School or institution")}
          {input("exam_results", "Latest results", { placeholder: "e.g. UCE 21, UACE 18 points" })}
        </div>
      </section>

      <section className="card space-y-4 p-4 sm:p-5">
        <h2 className="text-lg">Parent or guardian {secondary ? <span className="text-sm font-normal text-red">(needed for secondary students)</span> : <span className="text-sm font-normal text-muted">(optional)</span>}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {input("guardian_name", "Name")}
          {input("guardian_phone", "Phone", { type: "tel", inputMode: "tel", placeholder: "+256 7XX XXX XXX" })}
        </div>
      </section>

      <section className="card p-4 sm:p-5">
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" className="mt-0.5 h-5 w-5 accent-ink" checked={v.alerts_opt_in} onChange={(e) => set("alerts_opt_in", e.target.checked)} />
          <span><strong>Email me new scholarships</strong> that match my level of study.</span>
        </label>
      </section>

      <button disabled={busy} className="btn btn-gold w-full sm:w-auto">{busy ? "Saving..." : "Save profile"}</button>
    </form>
  );
}
