"use client";
import { useState } from "react";
import { saveContactSettings } from "@/app/actions/admin";

type Values = Record<"phone" | "whatsapp" | "email" | "address" | "facebook" | "instagram" | "tiktok" | "x" | "linkedin" | "youtube", string>;

const groups: { title: string; fields: [keyof Values, string, string?][] }[] = [
  { title: "Contact details", fields: [["phone", "Phone", "e.g. 0703 571 121"], ["whatsapp", "WhatsApp number", "Used by the green WhatsApp buttons"], ["email", "Email"], ["address", "Address"]] },
  { title: "Social media links", fields: [["facebook", "Facebook"], ["instagram", "Instagram"], ["tiktok", "TikTok"], ["x", "X (Twitter)"], ["linkedin", "LinkedIn"], ["youtube", "YouTube"]] },
];

export default function SettingsForm({ initial }: { initial: Values }) {
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErrors({});
    const r = await saveContactSettings(v);
    setBusy(false);
    if (!r.ok) setErrors(r.fieldErrors ?? {});
    setMsg(r.ok ? { ok: true, text: "Saved. The website now shows these details." } : { ok: false, text: r.error });
  }

  return (
    <form method="post" onSubmit={save} className="space-y-6" noValidate>
      {groups.map((g) => (
        <section key={g.title} className="card space-y-4 p-5">
          <h2 className="text-lg">{g.title}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {g.fields.map(([k, label, help]) => (
              <div key={k}>
                <label htmlFor={`s-${k}`} className="mb-1 block text-sm font-medium">{label}</label>
                <input id={`s-${k}`} className="input" value={v[k]} placeholder={g.title.startsWith("Social") ? "https://" : undefined}
                  onChange={(e) => setV((p) => ({ ...p, [k]: e.target.value }))} aria-invalid={!!errors[k]} />
                {help && <p className="mt-1 text-xs text-muted">{help}</p>}
                {errors[k] && <p role="alert" className="mt-1 text-sm text-red">{errors[k]}</p>}
              </div>
            ))}
          </div>
          {g.title.startsWith("Social") && <p className="text-xs text-muted">Leave a link empty to hide that icon.</p>}
        </section>
      ))}
      <div className="flex items-center gap-3">
        <button disabled={busy} className="btn btn-gold">{busy ? "Saving..." : "Save settings"}</button>
        {msg && <p role="status" className={`text-sm ${msg.ok ? "" : "text-red"}`}>{msg.text}</p>}
      </div>
    </form>
  );
}
