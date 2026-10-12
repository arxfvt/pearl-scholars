"use client";
import { useState } from "react";
import { submitContact } from "@/app/actions/engagement";
import Turnstile, { readTurnstile } from "@/components/Turnstile";

export default function ContactForm() {
  const [state, setState] = useState<{ ok: boolean; msg: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setBusy(true);
    const r = await submitContact({ name: fd.get("name"), email: fd.get("email"), message: fd.get("message") }, readTurnstile(form));
    setBusy(false);
    if (r.ok) form.reset();
    setState(r.ok ? { ok: true, msg: "Thank you. We received your message and will reply soon." } : { ok: false, msg: r.error });
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-5">
      <div>
        <label htmlFor="c-name" className="mb-1 block text-sm font-medium">Your name</label>
        <input id="c-name" name="name" required autoComplete="name" className="input" />
      </div>
      <div>
        <label htmlFor="c-email" className="mb-1 block text-sm font-medium">Email</label>
        <input id="c-email" name="email" type="email" required autoComplete="email" className="input" />
      </div>
      <div>
        <label htmlFor="c-msg" className="mb-1 block text-sm font-medium">Message</label>
        <textarea id="c-msg" name="message" required minLength={10} maxLength={5000} rows={5} className="input" />
      </div>
      <Turnstile />
      {state && <p role="status" className={`text-sm ${state.ok ? "" : "text-red"}`}>{state.msg}</p>}
      <button disabled={busy} className="btn btn-gold">{busy ? "Sending..." : "Send message"}</button>
    </form>
  );
}
