import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { nav } from "@/lib/site";
import AuthLink from "@/components/AuthLink";

export default function Header() {
  return (
    <header className="bg-ink text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" aria-label="Pearl Scholars home">
          <Image src="/brand/logo-horizontal-on-black.svg" alt="Pearl Scholars" width={190} height={44} priority className="h-9 w-auto" />
        </Link>
        <nav aria-label="Main" className="flex items-center gap-4 text-sm font-medium">
          <ul className="hidden gap-5 md:flex">
            {nav.map((n) => (<li key={n.href}><Link href={n.href} className="hover:underline">{n.label}</Link></li>))}
          </ul>
          <Suspense fallback={<span className="btn btn-gold" aria-hidden>Log in</span>}>
            <AuthLink />
          </Suspense>
        </nav>
      </div>
      <nav aria-label="Mobile" className="border-t border-white/15 md:hidden">
        <ul className="mx-auto flex max-w-6xl justify-between gap-2 overflow-x-auto px-4 py-2 text-sm">
          {nav.map((n) => (<li key={n.href}><Link href={n.href} className="whitespace-nowrap py-1">{n.label}</Link></li>))}
        </ul>
      </nav>
    </header>
  );
}
