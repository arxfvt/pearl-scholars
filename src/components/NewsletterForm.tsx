"use client";
import { useState } from "react";
import { subscribeNewsletter } from "@/app/actions/engagement";

export default function NewsletterForm() {
  const [state, setState] = useState<{ ok: boolean; msg: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    const email = new FormData(form).get("email");
    const r = await subscribeNewsletter({ email });
    setBusy(false);
    if (r.ok) form.reset();
    setState(r.ok ? { ok: true, msg: "You are subscribed. Thank you!" } : { ok: false, msg: r.error });
  }

  return (
    <form method="post" onSubmit={onSubmit} className="space-y-2" aria-label="Newsletter">
      <label htmlFor="nl" className="text-sm font-medium">Get new scholarships by email</label>
      <div className="flex gap-2">
        <input id="nl" name="email" type="email" required autoComplete="email" placeholder="you@example.com" className="input text-ink" />
        <button disabled={busy} className="btn btn-gold">Join</button>
      </div>
      {state && <p role="status" className={`text-sm ${state.ok ? "text-white" : "text-gold"}`}>{state.msg}</p>}
    </form>
  );
}
