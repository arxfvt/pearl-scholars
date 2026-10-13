import Image from "next/image";
import Link from "next/link";
import { site, nav } from "@/lib/site";
import { Suspense } from "react";
import NewsletterForm from "@/components/NewsletterForm";
import { getContact } from "@/lib/data/content";

export default function Footer() {
  return (
    <footer className="mt-16 bg-ink text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <Image src="/brand/logo-horizontal-on-black.svg" alt="Pearl Scholars" width={190} height={44} className="h-9 w-auto" />
          <p className="mt-3 text-sm text-white/80">{site.tagline}</p>
          <p className="mt-3 text-sm text-white/80">{site.address}</p>
          <Suspense fallback={null}><FooterContact /></Suspense>
        </div>
        <ul className="space-y-2 text-sm">
          {nav.map((n) => (<li key={n.href}><Link href={n.href} className="hover:underline">{n.label}</Link></li>))}
          <li><Link href="/faq" className="hover:underline">FAQ</Link></li>
          <li><Link href="/privacy" className="hover:underline">Privacy Policy</Link></li>
          <li><Link href="/terms" className="hover:underline">Terms</Link></li>
        </ul>
        <NewsletterForm />
      </div>
      <p className="border-t border-white/15 py-4 text-center text-xs text-white/70">&copy; Pearl Scholars. All rights reserved.</p>
    </footer>
  );
}

async function FooterContact() {
  const c = await getContact();
  return (
    <ul className="mt-3 space-y-1 text-sm">
      {c.phone && <li><a href={`tel:${c.phone.replace(/\s/g, "")}`} className="hover:underline">{c.phone}</a></li>}
      {c.email && <li><a href={`mailto:${c.email}`} className="hover:underline">{c.email}</a></li>}
    </ul>
  );
}
