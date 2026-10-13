import Image from "next/image";
import { avatarFor, type Testimonial } from "@/lib/data/content";

/** Success story: photo (or illustrated avatar) on top, quote, then name and scholarship. */
export default function StoryCard({ t, compact = false }: { t: Testimonial; compact?: boolean }) {
  const avatar = avatarFor(t);
  const size = compact ? 56 : 72;
  return (
    <figure className="card flex h-full flex-col p-5">
      <div className="flex items-center gap-3">
        <Image src={avatar.src} alt={avatar.isPhoto ? `Photo of ${t.name}` : ""} width={size} height={size}
          className="shrink-0 rounded-full border-2 border-gold object-cover" style={{ width: size, height: size }} />
        <figcaption className="min-w-0 text-sm">
          <strong className="block truncate text-base">{t.name}</strong>
          <span className="block text-muted">{t.scholarship_won}</span>
          {t.school && <span className="block truncate text-xs text-muted">{t.school}</span>}
        </figcaption>
      </div>
      <blockquote className={`mt-4 flex-1 ${compact ? "text-sm" : ""}`}>&ldquo;{t.quote}&rdquo;</blockquote>
      {t.video_url && /^https:\/\//.test(t.video_url) && (
        <a href={t.video_url} target="_blank" rel="noopener noreferrer" className="mt-3 text-sm font-bold underline">&#9654; Watch their story</a>
      )}
    </figure>
  );
}
