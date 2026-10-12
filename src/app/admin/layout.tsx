import { Suspense } from "react";
import Link from "next/link";
import { getAdmin } from "@/lib/auth";
import { BlockSkeleton } from "@/components/Skeleton";

export const metadata = { title: "Admin", robots: { index: false, follow: false } };

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/scholarships", label: "Scholarships" },
  { href: "/admin/images", label: "Site images" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav aria-label="Admin" className="mb-6 flex flex-wrap items-center gap-2 border-b border-line pb-4">
        <span className="mr-2 rounded bg-ink px-2 py-1 text-xs font-bold text-gold">ADMIN</span>
        {links.map((l) => (<Link key={l.href} href={l.href} className="btn btn-outline min-h-9 px-3 py-1 text-sm">{l.label}</Link>))}
      </nav>
      <Suspense fallback={<BlockSkeleton h="h-96" />}>
        <Guard>{children}</Guard>
      </Suspense>
    </div>
  );
}

async function Guard({ children }: { children: React.ReactNode }) {
  const admin = await getAdmin();
  if (!admin)
    return (
      <div className="card p-8 text-center">
        <h1 className="text-2xl">Admins only</h1>
        <p className="mt-2 text-muted">Your account does not have admin access. Ask an existing admin to invite you.</p>
        <Link href="/" className="btn btn-gold mt-5">Back home</Link>
      </div>
    );
  return <>{children}</>;
}
