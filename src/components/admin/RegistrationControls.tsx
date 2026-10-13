"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { setRegistrationStatus, saveRegistrationNotes } from "@/app/actions/admin";
import { statusLabels, type RegistrationStatus } from "@/lib/types";

export default function RegistrationControls({ id, status, notes }: { id: string; status: RegistrationStatus; notes: string }) {
  const router = useRouter();
  const [next, setNext] = useState(status);
  const [notify, setNotify] = useState(true);
  const [text, setText] = useState(notes);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function saveStatus() {
    setBusy(true);
    const r = await setRegistrationStatus([id], next, notify);
    setBusy(false);
    setMsg(r.ok ? (notify ? (r.emailed ? "Status updated and student emailed." : "Status updated. Email not sent (email service not set up yet).") : "Status updated.") : r.error);
    if (r.ok) router.refresh();
  }
  async function saveNotes() {
    setBusy(true);
    const r = await saveRegistrationNotes(id, text);
    setBusy(false);
    setMsg(r.ok ? "Notes saved." : r.error);
  }

  return (
    <div className="card space-y-4 p-5">
      <div>
        <label htmlFor="status" className="mb-1 block text-sm font-medium">Status</label>
        <select id="status" className="input" value={next} onChange={(e) => setNext(e.target.value as RegistrationStatus)}>
          {Object.entries(statusLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <label className="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" className="h-5 w-5 accent-ink" checked={notify} onChange={(e) => setNotify(e.target.checked)} /> Email the student about this change</label>
        <button className="btn btn-gold mt-3 w-full" disabled={busy || next === status} onClick={saveStatus}>Update status</button>
      </div>
      <div>
        <label htmlFor="notes" className="mb-1 block text-sm font-medium">Private admin notes</label>
        <textarea id="notes" rows={5} className="input" value={text} onChange={(e) => setText(e.target.value)} />
        <button className="btn btn-outline mt-2 w-full" disabled={busy || text === notes} onClick={saveNotes}>Save notes</button>
      </div>
      {msg && <p role="status" className="text-sm">{msg}</p>}
    </div>
  );
}
