import type { DisplayStatus } from "@/lib/data/scholarships";

const styles: Record<DisplayStatus, { label: string; cls: string }> = {
  open: { label: "Open", cls: "bg-ink text-white" },
  closing_soon: { label: "Closing soon", cls: "bg-red text-white" },
  closed: { label: "Closed", cls: "bg-line text-ink" },
};

export default function StatusBadge({ status }: { status: DisplayStatus }) {
  const s = styles[status];
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${s.cls}`}>{s.label}</span>;
}
