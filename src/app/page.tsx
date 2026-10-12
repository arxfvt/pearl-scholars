import { connection } from "next/server";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { site } from "@/lib/site";
import { levelLabels } from "@/lib/types";
import { getFeatured, getClosingSoon } from "@/lib/data/scholarships";
import { getFaq, getStats, getTestimonials, getContact, publicImageUrl, getSiteImage } from "@/lib/data/content";
import ScholarshipCard from "@/components/ScholarshipCard";
import { CardGridSkeleton } from "@/components/Skeleton";

export default function Home() {
  return (
    <>
      <section className="relative isolate overflow-hidden bg-ink text-white">
        <Suspense fallback={<HeroBackdrop url={null} />}><HeroImage /></Suspense>
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-14 text-center md:py-20">
          <Image src="/brand/icon-on-black.svg" alt="" width={88} height={88} priority />
          <h1 className="text-4xl md:text-6xl">{site.tagline}</h1>
          <p className="max-w-xl text-white/80">Find scholarships across Uganda and East Africa, register in minutes and track every step.</p>
          <form action="/scholarships" className="flex w-full max-w-2xl flex-col gap-2 sm:flex-row" role="search">
            <label htmlFor="q" className="sr-only">Search scholarships</label>
            <input id="q" name="q" placeholder="Search by keyword" className="input text-ink" />
            <label htmlFor="level" className="sr-only">Level of study</label>
            <select id="level" name="level" className="input text-ink sm:max-w-44" defaultValue="">
              <option value="">Any level</option>
              {Object.entries(levelLabels).map(([v, l]) => (<option key={v} value={v}>{l}</option>))}
            </select>
            <button className="btn btn-gold">Search</button>
          </form>
        </div>
      </section>

      <Section title="Featured scholarships" href="/scholarships" cta="See all">
        <Suspense fallback={<CardGridSkeleton />}><Featured /></Suspense>
      </Section>

      <section className="bg-ink py-12 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-2xl md:text-3xl">How it works</h2>
          <ol className="mt-6 grid gap-5 md:grid-cols-3">
            {[
              ["1", "Find", "Browse scholarships and filter by level, country and field."],
              ["2", "Register", "Fill one short form and upload your documents."],
              ["3", "Get notified", "We email you every time your status changes."],
            ].map(([n, t, d]) => (
              <li key={n} className="rounded-xl border border-white/20 p-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold font-extrabold text-ink">{n}</span>
                <h3 className="mt-3 text-xl">{t}</h3>
                <p className="mt-1 text-sm text-white/80">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <Suspense fallback={null}><Closing /></Suspense>
      <Suspense fallback={null}><Stats /></Suspense>
      <Suspense fallback={null}><Testimonials /></Suspense>
      <Suspense fallback={null}><FaqStrip /></Suspense>
      <Suspense fallback={null}><ContactStrip /></Suspense>
    </>
  );
}

async function HeroImage() {
  const img = await getSiteImage("hero").catch(() => null);
  return <HeroBackdrop url={img?.url ?? null} />;
}

/** Uploaded photo (or the brand pattern) under an ink overlay strong enough to keep white text at AA contrast. */
function HeroBackdrop({ url }: { url: string | null }) {
  return (
    <div className="absolute inset-0 -z-10" aria-hidden>
      <Image src={url ?? "/covers/hero-pattern.svg"} alt="" fill priority sizes="100vw" className="object-cover" />
      {url && <div className="absolute inset-0 bg-ink/75" />}
    </div>
  );
}

function Section({ title, href, cta, children }: { title: string; href?: string; cta?: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 className="text-2xl md:text-3xl">{title}</h2>
        {href && <Link href={href} className="text-sm font-bold underline">{cta}</Link>}
      </div>
      {children}
    </section>
  );
}

async function Featured() {
  await connection();
  const items = await getFeatured(3);
  const now = Date.now();
  if (!items.length) return <p className="text-muted">New scholarships are added regularly. Check back soon.</p>;
  return <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{items.map((s) => <ScholarshipCard key={s.id} s={s} now={now} />)}</div>;
}

async function Closing() {
  await connection();
  const items = await getClosingSoon(3);
  const now = Date.now();
  if (!items.length) return null;
  return (
    <Section title="Closing soon" href="/scholarships?sort=deadline" cta="See by deadline">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{items.map((s) => <ScholarshipCard key={s.id} s={s} now={now} />)}</div>
    </Section>
  );
}

async function Stats() {
  const stats = await getStats().catch(() => []);
  if (!stats.length) return null;
  return (
    <section className="bg-gold text-ink">
      <dl className="mx-auto grid max-w-6xl gap-6 px-4 py-8 text-center sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label}><dd className="text-4xl font-extrabold">{s.value.toLocaleString("en-US")}</dd><dt className="text-sm font-medium">{s.label}</dt></div>
        ))}
      </dl>
    </section>
  );
}

async function Testimonials() {
  const items = await getTestimonials(6);
  if (!items.length) return null;
  return (
    <Section title="Success stories" href="/testimonials" cta="Read more">
      <ul className="flex snap-x gap-4 overflow-x-auto pb-3" aria-label="Student testimonials">
        {items.map((t) => {
          const photo = publicImageUrl(t.photo_path);
          return (
            <li key={t.id} className="card w-72 shrink-0 snap-start p-5">
              <blockquote className="text-sm">&ldquo;{t.quote}&rdquo;</blockquote>
              <div className="mt-4 flex items-center gap-3">
                {photo && <Image src={photo} alt="" width={40} height={40} className="h-10 w-10 rounded-full object-cover" />}
                <p className="text-sm"><strong>{t.name}</strong><br /><span className="text-muted">{t.scholarship_won}</span></p>
              </div>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

async function FaqStrip() {
  const faq = (await getFaq()).slice(0, 5);
  if (!faq.length) return null;
  return (
    <Section title="Frequently asked questions" href="/faq" cta="All FAQs">
      <div className="space-y-2">
        {faq.map((f) => (
          <details key={f.q} className="card p-4">
            <summary className="cursor-pointer font-bold">{f.q}</summary>
            <p className="mt-2 text-sm text-muted">{f.a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}

async function ContactStrip() {
  const c = await getContact();
  return (
    <section className="mx-auto max-w-6xl px-4 pb-4">
      <div className="card flex flex-col items-start justify-between gap-4 p-6 md:flex-row md:items-center">
        <div>
          <h2 className="text-xl">Questions? Talk to us.</h2>
          <p className="text-sm text-muted">We are happy to help you choose and apply.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {c.whatsapp && <a className="btn btn-gold" href={`https://wa.me/${c.whatsapp}`} target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a>}
          <Link href="/contact" className="btn btn-outline">Contact page</Link>
        </div>
      </div>
    </section>
  );
}
