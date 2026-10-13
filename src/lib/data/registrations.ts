import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { RegistrationStatus, StudyLevel } from "@/lib/types";

export interface RegistrationFilters {
  scholarship?: string;
  status?: string;
  level?: string;
  gender?: string;
  district?: string;
  q?: string;
  from?: string; // YYYY-MM-DD
  to?: string;
  page?: number;
}

export interface RegistrationRow {
  id: string; reference: string; created_at: string; status: RegistrationStatus;
  full_name: string; email: string; phone: string; level: StudyLevel; institution: string; district: string;
  gender: string | null; date_of_birth: string | null; current_class: string | null; exam_results: string | null;
  guardian_name: string | null; guardian_phone: string | null; special_needs: string | null; heard_from: string | null;
  utm_source: string | null; utm_medium: string | null; utm_campaign: string | null;
  scholarship_id: string; scholarships: { title: string; slug: string } | null;
}

export const ADMIN_PAGE_SIZE = 50;
const STATUSES = ["submitted", "under_review", "shortlisted", "successful", "not_successful"];
const LEVELS = ["o_level", "a_level", "bachelors", "postgraduate"];
const UUID = /^[0-9a-f-]{36}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const columns =
  "id,reference,created_at,status,full_name,email,phone,level,institution,district,gender,date_of_birth,current_class,exam_results," +
  "guardian_name,guardian_phone,special_needs,heard_from,utm_source,utm_medium,utm_campaign,scholarship_id,scholarships(title,slug)";

export async function queryRegistrations(f: RegistrationFilters, opts: { paginate: boolean } = { paginate: true }) {
  const supabase = await createClient(); // RLS: only admins can read all registrations
  let q = supabase.from("registrations").select(columns, { count: "exact" });
  if (f.scholarship && UUID.test(f.scholarship)) q = q.eq("scholarship_id", f.scholarship);
  if (f.status && STATUSES.includes(f.status)) q = q.eq("status", f.status);
  if (f.level && LEVELS.includes(f.level)) q = q.eq("level", f.level);
  if (f.gender && ["female", "male", "prefer_not_to_say"].includes(f.gender)) q = q.eq("gender", f.gender);
  if (f.district) q = q.ilike("district", f.district.replace(/[%_,()]/g, ""));
  if (f.from && DATE.test(f.from)) q = q.gte("created_at", `${f.from}T00:00:00+03:00`);
  if (f.to && DATE.test(f.to)) q = q.lte("created_at", `${f.to}T23:59:59+03:00`);
  const term = f.q?.replace(/[^\p{L}\p{N}\s@.+-]/gu, " ").trim();
  if (term) q = q.or(`full_name.ilike.%${term}%,email.ilike.%${term}%,reference.ilike.%${term}%,phone.ilike.%${term}%,institution.ilike.%${term}%`);
  q = q.order("created_at", { ascending: false });

  const page = Math.max(1, f.page ?? 1);
  q = opts.paginate ? q.range((page - 1) * ADMIN_PAGE_SIZE, page * ADMIN_PAGE_SIZE - 1) : q.limit(10000);
  const { data, count, error } = await q;
  if (error) throw new Error(error.message);
  return { rows: (data ?? []) as unknown as RegistrationRow[], total: count ?? 0, page, pages: Math.max(1, Math.ceil((count ?? 0) / ADMIN_PAGE_SIZE)) };
}

/** Number of students registered per scholarship (all statuses), most popular first. */
export async function countsPerScholarship() {
  const supabase = await createClient();
  const [{ data: regs }, { data: sch }] = await Promise.all([
    supabase.from("registrations").select("scholarship_id,status").limit(20000),
    supabase.from("scholarships").select("id,title,status"),
  ]);
  const by = new Map<string, { total: number; successful: number }>();
  (regs ?? []).forEach((r) => {
    const e = by.get(r.scholarship_id) ?? { total: 0, successful: 0 };
    e.total++;
    if (r.status === "successful") e.successful++;
    by.set(r.scholarship_id, e);
  });
  return (sch ?? [])
    .map((s) => ({ id: s.id as string, title: s.title as string, status: s.status as string, ...(by.get(s.id) ?? { total: 0, successful: 0 }) }))
    .sort((a, b) => b.total - a.total);
}

export function filtersFrom(sp: Record<string, string | string[] | undefined>): RegistrationFilters {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;
  return {
    scholarship: one(sp.scholarship), status: one(sp.status), level: one(sp.level), gender: one(sp.gender),
    district: one(sp.district), q: one(sp.q), from: one(sp.from), to: one(sp.to), page: Number(one(sp.page)) || 1,
  };
}
