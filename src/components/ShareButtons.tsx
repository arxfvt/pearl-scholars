"use client";
import { useState } from "react";

export default function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const links = [
    { label: "WhatsApp", href: `https://wa.me/?text=${t}%20${u}` },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { label: "X", href: `https://twitter.com/intent/tweet?text=${t}&url=${u}` },
  ];
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  }
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Share this scholarship">
      <span className="text-sm font-medium">Share:</span>
      {links.map((l) => (
        <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className="btn btn-outline min-h-9 px-3 py-1 text-sm">{l.label}</a>
      ))}
      <button type="button" onClick={copy} className="btn btn-outline min-h-9 px-3 py-1 text-sm">{copied ? "Link copied" : "Copy link"}</button>
    </div>
  );
}
