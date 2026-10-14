"use client";
import { useState } from "react";
import { setAlerts } from "@/app/actions/student";

export default function AlertsToggle({ initial, levelLabel }: { initial: boolean; levelLabel: string | null }) {
  const [on, setOn] = useState(initial);
  const [busy, setBusy] = useState(false);
  async function flip() {
    setBusy(true);
    const r = await setAlerts(!on);
    setBusy(false);
    if (r.ok) setOn(!on);
  }
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-sm">
        <p className="font-bold">Email me new scholarships</p>
        <p className="text-muted">{levelLabel ? `For ${levelLabel} students, as soon as they are published.` : "Set your level of study in your profile to get matched alerts."}</p>
      </div>
      <button type="button" role="switch" aria-checked={on} aria-label="Email alerts for new scholarships" onClick={flip} disabled={busy}
        className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${on ? "bg-ink" : "bg-line"}`}>
        <span className={`absolute top-1 h-6 w-6 rounded-full transition-all ${on ? "left-7 bg-gold" : "left-1 bg-surface"}`} />
      </button>
    </div>
  );
}
