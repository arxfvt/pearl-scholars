import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { createPublicClient } from "@/lib/supabase/public";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = ["", "/scholarships", "/testimonials", "/about", "/contact", "/faq", "/privacy", "/terms", "/signup"].map((p) => ({
    url: `${site.url}${p}`,
    changeFrequency: (p === "" || p === "/scholarships" ? "daily" : "monthly") as "daily" | "monthly",
    priority: p === "" ? 1 : p === "/scholarships" ? 0.9 : 0.5,
  }));
  const { data } = await createPublicClient().from("scholarships").select("slug,updated_at,status").in("status", ["published", "closed"]);
  const scholarships = (data ?? []).map((s) => ({
    url: `${site.url}/scholarships/${s.slug}`,
    lastModified: s.updated_at,
    changeFrequency: "weekly" as const,
    priority: s.status === "published" ? 0.8 : 0.3,
  }));
  return [...pages, ...scholarships];
}
