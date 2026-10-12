import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Scholarship, StudyLevel } from "@/lib/types";

export const PAGE_SIZE = 9;
export type DisplayStatus = "open" | "closing_soon" | "closed";

export function displayStatus(s: Pick<Scholarship, "status" | "deadline">, now = Date.now()): DisplayStatus {
  if (s.status === "closed") return "closed";
  if (!s.deadline) return "open";
  const left = new Date(s.deadline).getTime() - now;
  if (left < 0) return "closed";
  return left <= 14 * 86400000 ? "closing_soon" : "open";
}

const card = "id,slug,title,provider,country,summary,amount_text,levels,fields,cover_image_path,deadline,featured,status";

export interface ScholarshipFilters {
  q?: string;
  level?: string;
  country?: string;
  field?: string;
  deadline?: string; // "7" | "30" | "90"
  sort?: "newest" | "deadline";
  page?: number;
}

const LEVELS: StudyLevel[] = ["o_level", "a_level", "bachelors", "postgraduate"];

export async function listScholarships(f: ScholarshipFilters) {
  await connection();
  const supabase = await createClient();
  const page = Math.max(1, f.page ?? 1);
  let query = supabase.from("scholarships").select(card, { count: "exact" }).in("status", ["published", "closed"]);

  const q = f.q?.replace(/[^\p{L}\p{N}\s-]/gu, " ").trim();
  if (q) query = query.or(`title.ilike.%${q}%,provider.ilike.%${q}%,summary.ilike.%${q}%`);
  if (f.level && LEVELS.includes(f.level as StudyLevel)) query = query.contains("levels", [f.level]);
  if (f.country) query = query.eq("country", f.country);
  if (f.field) query = query.contains("fields", [f.field]);
  if (f.deadline && ["7", "30", "90"].includes(f.deadline)) {
    const now = new Date();
    query = query.gte("deadline", now.toISOString()).lte("deadline", new Date(now.getTime() + Number(f.deadline) * 86400000).toISOString());
  }
  query = f.sort === "deadline"
    ? query.order("deadline", { ascending: true, nullsFirst: false })
    : query.order("created_at", { ascending: false });

  const from = (page - 1) * PAGE_SIZE;
  const { data, count, error } = await query.range(from, from + PAGE_SIZE - 1);
  if (error) throw new Error(error.message);
  return { items: (data ?? []) as unknown as Scholarship[], total: count ?? 0, page, pages: Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE)) };
}

export async function filterOptions() {
  const supabase = await createClient();
  const { data } = await supabase.from("scholarships").select("country,fields").in("status", ["published", "closed"]);
  const countries = new Set<string>();
  const fields = new Set<string>();
  (data ?? []).forEach((r) => {
    if (r.country) countries.add(r.country);
    (r.fields ?? []).forEach((x: string) => fields.add(x));
  });
  return { countries: [...countries].sort(), fields: [...fields].sort() };
}

export async function getFeatured(limit = 3) {
  const supabase = await createClient();
  const { data } = await supabase.from("scholarships").select(card).eq("status", "published").eq("featured", true).order("deadline", { ascending: true, nullsFirst: false }).limit(limit);
  return (data ?? []) as unknown as Scholarship[];
}

export async function getClosingSoon(limit = 4) {
  await connection();
  const supabase = await createClient();
  const now = new Date();
  const { data } = await supabase.from("scholarships").select(card).eq("status", "published")
    .gte("deadline", now.toISOString()).lte("deadline", new Date(now.getTime() + 30 * 86400000).toISOString())
    .order("deadline", { ascending: true }).limit(limit);
  return (data ?? []) as unknown as Scholarship[];
}

export async function getScholarshipBySlug(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("scholarships").select("*").eq("slug", slug).in("status", ["published", "closed"]).maybeSingle();
  return (data as Scholarship | null) ?? null;
}
