import { brandCard, ogSize } from "@/lib/og";
import { createPublicClient } from "@/lib/supabase/public";
import { levelLabels, type StudyLevel } from "@/lib/types";
import { formatDate } from "@/lib/format";

export const alt = "Scholarship on Pearl Scholars";
export const size = ogSize;
export const contentType = "image/png";

/** Share card for one scholarship: title, deadline (red when close), levels and value. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data: s } = await createPublicClient().from("scholarships")
    .select("title,deadline,levels,amount_text,country,status").eq("slug", slug).in("status", ["published", "closed"]).maybeSingle();

  if (!s) return brandCard({ eyebrow: "Scholarship", title: "Find genuine scholarships on Pearl Scholars", footer: "pearlscholarsfursa.com" });

  const msLeft = s.deadline ? new Date(s.deadline).getTime() - Date.now() : null;
  const closed = s.status === "closed" || (msLeft !== null && msLeft < 0);
  const soon = msLeft !== null && msLeft >= 0 && msLeft < 14 * 86400000;
  const chips: { text: string; tone?: "gold" | "red" | "outline" }[] = [
    { text: closed ? "Applications closed" : s.deadline ? `Deadline ${formatDate(s.deadline)}` : "Open now", tone: closed || soon ? "red" : "gold" },
    ...(s.levels as StudyLevel[]).slice(0, 3).map((l) => ({ text: levelLabels[l], tone: "outline" as const })),
  ];
  if (s.amount_text && s.amount_text.length <= 28) chips.push({ text: s.amount_text, tone: "outline" });

  return brandCard({ eyebrow: `Scholarship · ${s.country}`, title: s.title, chips, footer: `Register free at pearlscholarsfursa.com` });
}
