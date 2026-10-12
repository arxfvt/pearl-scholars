import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-4xl">Page not found</h1>
      <p className="mt-3 text-muted">That page does not exist or has moved.</p>
      <Link href="/" className="btn btn-gold mt-6">Back home</Link>
    </div>
  );
}
