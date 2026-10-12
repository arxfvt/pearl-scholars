import Image from "next/image";
import Link from "next/link";
import type { Scholarship } from "@/lib/types";
import { levelLabels } from "@/lib/types";
import { displayStatus } from "@/lib/data/scholarships";
import { coverFor } from "@/lib/data/content";
import { formatDate } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";

export default function ScholarshipCard({ s, now }: { s: Scholarship; now: number }) {
  const status = displayStatus(s, now);
  const cover = coverFor(s);
  return (
    <article className="card flex flex-col overflow-hidden">
      <div className="relative aspect-[16/7] bg-ink">
        <Image src={cover} alt="" fill sizes="(min-width:1024px) 360px, 100vw" className="object-cover" />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <StatusBadge status={status} />
          <span className="text-xs text-muted">{s.country}</span>
        </div>
        <h3 className="text-lg leading-snug">
          <Link href={`/scholarships/${s.slug}`} className="after:absolute after:inset-0 relative hover:underline">{s.title}</Link>
        </h3>
        <p className="text-sm text-muted">{s.provider}</p>
        <div className="flex flex-wrap gap-1.5">
          {s.levels.map((l) => (<span key={l} className="rounded border border-line px-2 py-0.5 text-xs">{levelLabels[l]}</span>))}
        </div>
        <dl className="mt-auto grid grid-cols-2 gap-2 border-t border-line pt-3 text-sm">
          <div><dt className="text-xs text-muted">Value</dt><dd className="font-medium">{s.amount_text ?? "See details"}</dd></div>
          <div><dt className="text-xs text-muted">Deadline</dt><dd className={`font-medium ${status === "closing_soon" ? "text-red" : ""}`}>{formatDate(s.deadline)}</dd></div>
        </dl>
      </div>
    </article>
  );
}
