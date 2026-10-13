"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setRegistrationStatus } from "@/app/actions/admin";
import { statusLabels, levelLabels, type RegistrationStatus, type StudyLevel } from "@/lib/types";

interface Row {
  id: string; reference: string; created: string; status: RegistrationStatus; name: string; phone: string;
  scholarship: string; level: StudyLevel; currentClass: string | null; district: string; gender: string | null;
}

const statusStyle: Record<RegistrationStatus, string> = {
  submitted: "bg-line text-ink", under_review: "bg-ink text-white", shortlisted: "bg-gold text-ink",
  successful: "bg-ink text-gold", not_successful: "bg-red text-white",
};

export default function RegistrationsTable({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [status, setStatus] = useState<RegistrationStatus>("under_review");
  const [notify, setNotify] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const all = rows.length > 0 && selected.length === rows.length;

  async function apply() {
    if (!selected.length) return;
    if (!confirm(`Set ${selected.length} registration(s) to "${statusLabels[status]}"${notify ? " and email the students" : ""}?`)) return;
    setBusy(true);
    const r = await setRegistrationStatus(selected, status, notify);
    setBusy(false);
    setMsg(r.ok ? `Updated ${selected.length}.${notify ? ` Emails sent: ${r.emailed ?? 0}.` : ""}` : r.error);
    if (r.ok) { setSelected([]); router.refresh(); }
  }

  if (!rows.length) return <div className="card mt-4 p-10 text-center text-muted">No registrations match these filters.</div>;

  return (
    <div className="mt-4 space-y-3">
      <div className="card flex flex-wrap items-center gap-3 p-3 text-sm">
        <span className="font-medium">{selected.length} selected</span>
        <label className="sr-only" htmlFor="bulk-status">New status</label>
        <select id="bulk-status" className="input max-w-48" value={status} onChange={(e) => setStatus(e.target.value as RegistrationStatus)}>
          {Object.entries(statusLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <label className="flex items-center gap-2"><input type="checkbox" className="h-5 w-5 accent-ink" checked={notify} onChange={(e) => setNotify(e.target.checked)} /> Email students</label>
        <button className="btn btn-gold" disabled={busy || !selected.length} onClick={apply}>{busy ? "Updating..." : "Change status"}</button>
        {msg && <span role="status">{msg}</span>}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-line bg-ivory text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="p-3"><input type="checkbox" aria-label="Select all" className="h-4 w-4 accent-ink" checked={all} onChange={(e) => setSelected(e.target.checked ? rows.map((r) => r.id) : [])} /></th>
              <th className="p-3">Student</th><th className="p-3">Scholarship</th><th className="p-3">Level / class</th>
              <th className="p-3">District</th><th className="p-3">Gender</th><th className="p-3">Status</th><th className="p-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-line last:border-0 hover:bg-ivory">
                <td className="p-3"><input type="checkbox" aria-label={`Select ${r.name}`} className="h-4 w-4 accent-ink" checked={selected.includes(r.id)} onChange={(e) => setSelected(e.target.checked ? [...selected, r.id] : selected.filter((x) => x !== r.id))} /></td>
                <td className="p-3"><Link href={`/admin/registrations/${r.id}`} className="font-bold underline">{r.name}</Link><br /><span className="text-xs text-muted">{r.reference} · {r.phone}</span></td>
                <td className="max-w-56 truncate p-3">{r.scholarship}</td>
                <td className="p-3">{levelLabels[r.level]}{r.currentClass ? <><br /><span className="text-xs text-muted">{r.currentClass}</span></> : null}</td>
                <td className="p-3">{r.district}</td>
                <td className="p-3 capitalize">{r.gender?.replace(/_/g, " ") ?? "—"}</td>
                <td className="p-3"><span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-bold ${statusStyle[r.status]}`}>{statusLabels[r.status]}</span></td>
                <td className="whitespace-nowrap p-3">{r.created}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
