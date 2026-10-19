import { Suspense } from "react";
import { getContact } from "@/lib/data/content";
import ContactForm from "@/components/ContactForm";
import { BlockSkeleton } from "@/components/Skeleton";

export const metadata = { title: "Contact", description: "Contact Pearl Scholars by phone, WhatsApp, email or the form." , alternates: { canonical: "/contact" } };

const socialLabels: Record<string, string> = { facebook: "Facebook", instagram: "Instagram", tiktok: "TikTok", x: "X", linkedin: "LinkedIn", youtube: "YouTube" };

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl md:text-4xl">Contact us</h1>
      <div className="mt-6 grid gap-8 md:grid-cols-2">
        <Suspense fallback={<BlockSkeleton />}><Details /></Suspense>
        <ContactForm />
      </div>
    </div>
  );
}

async function Details() {
  const c = await getContact();
  return (
    <div className="card space-y-4 p-5">
      <dl className="space-y-3 text-sm">
        {c.phone && <div><dt className="text-xs text-muted">Phone</dt><dd><a className="font-bold underline" href={`tel:${c.phone.replace(/\s/g, "")}`}>{c.phone}</a></dd></div>}
        {c.email && <div><dt className="text-xs text-muted">Email</dt><dd><a className="font-bold underline" href={`mailto:${c.email}`}>{c.email}</a></dd></div>}
        <div><dt className="text-xs text-muted">Address</dt><dd className="font-bold">{c.address}</dd></div>
      </dl>
      {c.whatsapp && <a className="btn btn-gold" href={`https://wa.me/${c.whatsapp}`} target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a>}
      {Object.keys(c.social).length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Social media">
          {Object.entries(c.social).filter(([, u]) => /^https:\/\//.test(u)).map(([k, u]) => (
            <li key={k}><a href={u} target="_blank" rel="noopener noreferrer" className="btn btn-outline min-h-9 px-3 py-1 text-sm">{socialLabels[k] ?? k}</a></li>
          ))}
        </ul>
      )}
    </div>
  );
}
