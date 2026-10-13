import Image from "next/image";
import Link from "next/link";
import type { Scholarship } from "@/lib/types";
import { levelLabels } from "@/lib/types";
import { displayStatus, providerLabel } from "@/lib/data/scholarships";
import { coverFor } from "@/lib/data/content";
import { formatDate } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";

/** Compact side-by-side card on phones (more scholarships per screen), tall card from the sm breakpoint up. */
export default function ScholarshipCard({ s, now }: { s: Scholarship; now: number }) {
  const status = displayStatus(s, now);
  const cover = coverFor(s);
  return (
    <article className="card relative flex overflow-hidden sm:flex-col">
      <div className="relative w-28 shrink-0 bg-ink sm:aspect-[16/7] sm:w-full">
        <Image src={cover} alt="" fill sizes="(min-width:1024px) 360px, (min-width:640px) 50vw, 112px" className="object-cover" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-3 sm:gap-3 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <StatusBadge status={status} />
          <span className="truncate text-xs text-muted">{s.country}</span>
        </div>
        <h3 className="text-base leading-snug sm:text-lg">
          <Link href={`/scholarships/${s.slug}`} className="after:absolute after:inset-0 hover:underline">{s.title}</Link>
        </h3>
        <p className="truncate text-xs text-muted sm:text-sm">{providerLabel(s)}</p>
        <div className="hidden flex-wrap gap-1.5 sm:flex">
          {s.levels.map((l) => (<span key={l} className="rounded border border-line px-2 py-0.5 text-xs">{levelLabels[l]}</span>))}
        </div>
        <p className="text-xs text-muted sm:hidden">{s.levels.map((l) => levelLabels[l]).join(" · ")}</p>
        <dl className="mt-auto grid grid-cols-2 gap-2 border-t border-line pt-2 text-xs sm:pt-3 sm:text-sm">
          <div className="min-w-0"><dt className="text-muted">Value</dt><dd className="truncate font-medium">{s.amount_text ?? "See details"}</dd></div>
          <div><dt className="text-muted">Deadline</dt><dd className={`font-medium ${status === "closing_soon" ? "text-red" : ""}`}>{formatDate(s.deadline)}</dd></div>
        </dl>
      </div>
    </article>
  );
}
