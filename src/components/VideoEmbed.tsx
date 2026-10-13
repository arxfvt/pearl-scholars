"use client";
import { useState } from "react";

export function youTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\.|^m\./, "");
    if (host === "youtu.be") return u.pathname.slice(1).split("/")[0] || null;
    if (host === "youtube.com" || host === "youtube-nocookie.com") {
      if (u.searchParams.get("v")) return u.searchParams.get("v");
      const m = u.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{6,})/);
      return m?.[1] ?? null;
    }
  } catch {
    /* not a URL */
  }
  return null;
}

/** Shows a lightweight thumbnail and only loads the YouTube player when tapped (saves mobile data). Other links get a button. */
export default function VideoEmbed({ url, title }: { url: string; title: string }) {
  const [play, setPlay] = useState(false);
  const id = youTubeId(url);
  const safeId = id && /^[\w-]{6,20}$/.test(id) ? id : null;

  if (!safeId)
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
        <span aria-hidden>&#9654;</span> Watch video
      </a>
    );

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-ink">
      {play ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${safeId}?autoplay=1&rel=0`}
          title={`Video: ${title}`}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <button type="button" onClick={() => setPlay(true)} className="group absolute inset-0 h-full w-full" aria-label={`Play video: ${title}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://i.ytimg.com/vi/${safeId}/hqdefault.jpg`} alt="" loading="lazy" className="h-full w-full object-cover opacity-80" />
          <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gold text-2xl text-ink shadow-lg group-hover:scale-105">&#9654;</span>
        </button>
      )}
    </div>
  );
}
