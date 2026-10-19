import { connection } from "next/server";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import sanitizeHtml from "sanitize-html";
import { getScholarshipBySlug, displayStatus, providerLabel } from "@/lib/data/scholarships";
import VideoEmbed from "@/components/VideoEmbed";
import AdminShortcut from "@/components/AdminShortcut";
import SaveButton from "@/components/student/SaveButton";
import { createClient } from "@/lib/supabase/server";
import { coverFor } from "@/lib/data/content";
import { levelLabels } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { site } from "@/lib/site";
import StatusBadge from "@/components/StatusBadge";
import Countdown from "@/components/Countdown";
import ShareButtons from "@/components/ShareButtons";
import { BlockSkeleton } from "@/components/Skeleton";
import type { Metadata } from "next";
import { createPublicClient } from "@/lib/supabase/public";

const plain = (t: string | null | undefined) => (t ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

/** Per-scholarship title, description and share preview, so each listing can rank and share on its own. */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { data: s } = await createPublicClient().from("scholarships")
    .select("title,summary,description,provider,provider_hidden,country,deadline,levels,amount_text")
    .eq("slug", slug).in("status", ["published", "closed"]).maybeSingle();
  if (!s) return { title: "Scholarship not found", robots: { index: false } };
  const levels = (s.levels as (keyof typeof levelLabels)[]).map((l) => levelLabels[l]).join(", ");
  const deadline = s.deadline ? ` Deadline ${formatDate(s.deadline)}.` : "";
  const description = (plain(s.summary) || plain(s.description) || `${s.title} for ${levels} students in ${s.country}.`).slice(0, 150) + deadline;
  const url = `/scholarships/${slug}`;
  return {
    title: s.title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "article", url, title: s.title, description, siteName: site.name },
    twitter: { card: "summary_large_image", title: s.title, description },
  };
}

export default function Page({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-4xl px-4 py-10"><BlockSkeleton h="h-96" /></div>}>
      <Detail params={params} />
    </Suspense>
  );
}

const clean = (html: string) =>
  sanitizeHtml(html, { allowedTags: ["p", "br", "strong", "em", "b", "i", "u", "ul", "ol", "li", "h2", "h3", "h4", "a", "blockquote"], allowedAttributes: { a: ["href", "target", "rel"] }, allowedSchemes: ["http", "https", "mailto"], transformTags: { a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" }) } });

/** Plain text from the admin form: blank lines become paragraphs, lines starting with "- " become bullets. */
const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function toHtml(text: string) {
  return text.trim().split(/\n\s*\n/).map((block) => {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.every((l) => /^[-*•]\s+/.test(l))) return `<ul>${lines.map((l) => `<li>${esc(l.replace(/^[-*•]\s+/, ""))}</li>`).join("")}</ul>`;
    return `<p>${lines.map(esc).join("<br>")}</p>`;
  }).join("");
}

async function Detail({ params }: { params: Promise<{ slug: string }> }) {
  await connection();
  const { slug } = await params;
  const s = await getScholarshipBySlug(slug);
  if (!s) notFound();
  const status = displayStatus(s, Date.now());
  const cover = coverFor(s);
  const url = `${site.url}/scholarships/${s.slug}`;

  const blocks: [string, string | null][] = [
    ["About this scholarship", s.description],
    ["Eligibility", s.eligibility],
    ["Benefits", s.benefits],
    ["Required documents", s.required_documents],
  ];

  return (
    <article className="mx-auto max-w-4xl px-4 pb-28 pt-6 md:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "EducationalOccupationalProgram",
        name: s.title,
        description: plain(s.summary) || plain(s.description).slice(0, 300) || undefined,
        url,
        image: cover.startsWith("http") ? cover : `${site.url}${cover}`,
        provider: { "@type": "Organization", name: providerLabel(s), ...(s.provider_url && !s.provider_hidden ? { url: s.provider_url } : {}) },
        educationalProgramMode: "full-time",
        ...(s.deadline ? { applicationDeadline: s.deadline.slice(0, 10) } : {}),
        offers: { "@type": "Offer", price: 0, priceCurrency: "UGX", description: s.amount_text ?? "Scholarship", availability: status === "closed" ? "https://schema.org/SoldOut" : "https://schema.org/InStock" },
        financialAidEligible: s.amount_text ?? "Scholarship",
        audience: { "@type": "EducationalAudience", educationalRole: "student", audienceType: s.levels.map((l) => levelLabels[l]).join(", ") },
        locationCreated: { "@type": "Place", address: { "@type": "PostalAddress", addressCountry: s.country } },
      }).replace(/</g, "\\u003c") }} />
      <AdminShortcut links={[{ href: `/admin/scholarships/${s.id}`, label: "Edit this scholarship" }, { href: `/admin/registrations?scholarship=${s.id}`, label: "See registered students" }]} />
      <nav aria-label="Breadcrumb" className="mb-4 text-sm"><Link href="/scholarships" className="underline">Scholarships</Link></nav>
      <div className="relative mb-6 aspect-[16/7] overflow-hidden rounded-xl bg-ink"><Image src={cover} alt="" fill sizes="(min-width:896px) 896px, 100vw" className="object-cover" priority /></div>
      <div className="flex flex-wrap items-center gap-3"><StatusBadge status={status} /><span className="text-sm text-muted">{s.country}</span></div>
      <h1 className="mt-3 text-2xl leading-tight md:text-4xl">{s.title}</h1>
      <p className="mt-1 text-muted">{providerLabel(s)}</p>

      <dl className="card mt-5 grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 sm:p-5">
        <div><dt className="text-xs text-muted">Value</dt><dd className="font-bold">{s.amount_text ?? "See details"}</dd></div>
        <div className="order-last col-span-2 sm:order-none sm:col-span-1"><dt className="text-xs text-muted">Levels</dt><dd className="font-bold">{s.levels.map((l) => levelLabels[l]).join(", ")}</dd></div>
        <div>
          <dt className="text-xs text-muted">Deadline</dt>
          <dd className="font-bold">{formatDate(s.deadline)}{s.deadline && <><br /><Countdown deadline={s.deadline} /></>}</dd>
        </div>
      </dl>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {status === "closed" ? (
          <span className="rounded-lg border border-line bg-surface px-4 py-3 font-bold">Applications are closed</span>
        ) : (
          <Link href={`/scholarships/${s.slug}/register`} className="btn btn-gold w-full sm:w-auto">Register for this scholarship</Link>
        )}
        <Suspense fallback={null}><SaveSlot id={s.id} slug={s.slug} /></Suspense>
        {s.provider_url && !s.provider_hidden && <a href={s.provider_url} target="_blank" rel="noopener noreferrer" className="btn btn-outline w-full sm:w-auto">Visit provider site</a>}
      </div>

      {s.video_url && (
        <section className="mt-8">
          <h2 className="mb-3 text-xl">Watch: about this scholarship</h2>
          <VideoEmbed url={s.video_url} title={s.title} />
        </section>
      )}

      <div className="mt-8 space-y-8">
        {blocks.map(([title, body]) => body && (
          <section key={title}>
            <h2 className="text-xl">{title}</h2>
            <div className="mt-2 space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:underline" dangerouslySetInnerHTML={{ __html: clean(body.startsWith("<") ? body : toHtml(body)) }} />
          </section>
        ))}
      </div>

      <div className="mt-8 border-t border-line pt-5"><ShareButtons url={url} title={s.title} /></div>
      {status !== "closed" && (
        <div data-mobile-cta className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur md:hidden">
          <div className="min-w-0 flex-1 text-xs">
            <p className="text-muted">Deadline</p>
            <p className={`truncate font-bold ${status === "closing_soon" ? "text-red" : ""}`}>{formatDate(s.deadline)}</p>
          </div>
          <Link href={`/scholarships/${s.slug}/register`} className="btn btn-gold">Register now</Link>
        </div>
      )}
    </article>
  );
}

async function SaveSlot({ id, slug }: { id: string; slug: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let saved = false;
  if (user) {
    const { data } = await supabase.from("saved_scholarships").select("scholarship_id").eq("user_id", user.id).eq("scholarship_id", id).maybeSingle();
    saved = !!data;
  }
  return <SaveButton scholarshipId={id} slug={slug} initiallySaved={saved} className="w-full sm:w-auto" />;
}
