"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";
import { scholarshipSchema, normalizeUgPhone } from "@/lib/validation";
import { slugify } from "@/lib/format";
import { statusLabels, type RegistrationStatus } from "@/lib/types";
import { sendEmail, statusEmail } from "@/lib/email";

export type AdminResult = { ok: true; id?: string } | { ok: false; error: string; fieldErrors?: Record<string, string> };

const denied: AdminResult = { ok: false, error: "You are not allowed to do that." };

async function adminOrNull() {
  try {
    return await requireAdmin();
  } catch {
    return null;
  }
}

async function audit(actorId: string, action: string, entity: string, entityId: string | null, details?: object) {
  const supabase = await createClient();
  await supabase.from("audit_log").insert({ actor_id: actorId, action, entity, entity_id: entityId, details: details ?? null });
}

/** Kampala is UTC+3 all year (no daylight saving). */
const kampalaToIso = (local: string) => new Date(`${local}:00+03:00`).toISOString();

async function uniqueSlug(base: string, ignoreId?: string) {
  const supabase = await createClient();
  const root = slugify(base).slice(0, 100) || "scholarship";
  for (let i = 1; i < 50; i++) {
    const candidate = i === 1 ? root : `${root}-${i}`;
    const { data } = await supabase.from("scholarships").select("id").eq("slug", candidate).maybeSingle();
    if (!data || data.id === ignoreId) return candidate;
  }
  return `${root}-${Date.now()}`;
}

export async function saveScholarship(id: string | null, raw: unknown): Promise<AdminResult> {
  const admin = await adminOrNull();
  if (!admin) return denied;

  const parsed = scholarshipSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((i) => { fieldErrors[String(i.path[0])] = i.message; });
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
  }
  const v = parsed.data;

  const row = {
    ...v,
    slug: await uniqueSlug(v.slug || v.title, id ?? undefined),
    deadline: v.deadline ? kampalaToIso(v.deadline) : null,
    cover_image_path: v.cover_image_path ?? null,
  };

  const supabase = await createClient();
  if (id) {
    const { data: old } = await supabase.from("scholarships").select("cover_image_path").eq("id", id).single();
    const { error } = await supabase.from("scholarships").update(row).eq("id", id);
    if (error) return { ok: false, error: "Could not save. Please try again." };
    if (old?.cover_image_path && old.cover_image_path !== row.cover_image_path) await supabase.storage.from("site-images").remove([old.cover_image_path]);
    await audit(admin.id, "update", "scholarship", id, { title: v.title, status: v.status });
    revalidatePath("/admin/scholarships");
    return { ok: true, id };
  }
  const { data, error } = await supabase.from("scholarships").insert({ ...row, created_by: admin.id }).select("id").single();
  if (error || !data) return { ok: false, error: "Could not save. Please try again." };
  await audit(admin.id, "create", "scholarship", data.id, { title: v.title, status: v.status });
  revalidatePath("/admin/scholarships");
  return { ok: true, id: data.id };
}

export async function setScholarshipStatus(id: string, status: "draft" | "published" | "closed"): Promise<AdminResult> {
  const admin = await adminOrNull();
  if (!admin) return denied;
  const supabase = await createClient();
  const { error } = await supabase.from("scholarships").update({ status }).eq("id", id);
  if (error) return { ok: false, error: "Could not update status." };
  await audit(admin.id, `status:${status}`, "scholarship", id);
  revalidatePath("/admin/scholarships");
  return { ok: true };
}

export async function duplicateScholarship(id: string): Promise<AdminResult> {
  const admin = await adminOrNull();
  if (!admin) return denied;
  const supabase = await createClient();
  const { data: s } = await supabase.from("scholarships").select("*").eq("id", id).single();
  if (!s) return { ok: false, error: "Scholarship not found." };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _id, created_at: _c, updated_at: _u, slug, title, cover_image_path: _cover, ...rest } = s;
  const copy = { ...rest, title: `${title} (copy)`, slug: await uniqueSlug(`${slug}-copy`), cover_image_path: null, status: "draft", featured: false, is_sample: false, created_by: admin.id };
  const { data, error } = await supabase.from("scholarships").insert(copy).select("id").single();
  if (error || !data) return { ok: false, error: "Could not duplicate." };
  await audit(admin.id, "duplicate", "scholarship", data.id, { from: id });
  revalidatePath("/admin/scholarships");
  return { ok: true, id: data.id };
}

export async function deleteScholarship(id: string): Promise<AdminResult> {
  const admin = await adminOrNull();
  if (!admin) return denied;
  const supabase = await createClient();
  const { count } = await supabase.from("registrations").select("id", { count: "exact", head: true }).eq("scholarship_id", id);
  if (count) return { ok: false, error: `This scholarship has ${count} registration(s). Close it instead of deleting it.` };
  const { data: s } = await supabase.from("scholarships").select("title,cover_image_path").eq("id", id).single();
  const { error } = await supabase.from("scholarships").delete().eq("id", id);
  if (error) return { ok: false, error: "Could not delete." };
  if (s?.cover_image_path) await supabase.storage.from("site-images").remove([s.cover_image_path]);
  await audit(admin.id, "delete", "scholarship", id, { title: s?.title });
  revalidatePath("/admin/scholarships");
  return { ok: true };
}

export async function setSiteImage(slot: string, path: string | null, alt: string): Promise<AdminResult> {
  const admin = await adminOrNull();
  if (!admin) return denied;
  if (!/^[a-z_]{2,40}$/.test(slot)) return { ok: false, error: "Unknown image slot." };
  if (path && !new RegExp(`^${slot}/[\\w-]+\\.webp$`).test(path)) return { ok: false, error: "Invalid image." };
  const supabase = await createClient();
  const { data: old } = await supabase.from("site_images").select("storage_path").eq("slot", slot).maybeSingle();
  const { error } = path
    ? await supabase.from("site_images").upsert({ slot, storage_path: path, alt: alt.slice(0, 200), updated_at: new Date().toISOString() })
    : await supabase.from("site_images").delete().eq("slot", slot);
  if (error) return { ok: false, error: "Could not save the image." };
  if (old?.storage_path && old.storage_path !== path) await supabase.storage.from("site-images").remove([old.storage_path]);
  await audit(admin.id, path ? "replace" : "remove", "site_image", slot);
  revalidatePath("/");
  return { ok: true };
}

// ───────────── Registrations ─────────────

const regStatuses = ["submitted", "under_review", "shortlisted", "successful", "not_successful"] as const;

/** Change status for one or many registrations. Optionally emails each student. */
export async function setRegistrationStatus(ids: string[], status: RegistrationStatus, notify: boolean): Promise<AdminResult & { emailed?: number }> {
  const admin = await adminOrNull();
  if (!admin) return denied;
  if (!regStatuses.includes(status) || !ids.length || ids.length > 500 || !ids.every((i) => /^[0-9a-f-]{36}$/.test(i)))
    return { ok: false, error: "Invalid request." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("registrations").update({ status }).in("id", ids)
    .select("id,full_name,email,reference,scholarships(title)");
  if (error) return { ok: false, error: "Could not update status." };

  let emailed = 0;
  if (notify) {
    for (const r of data ?? []) {
      const title = (r.scholarships as unknown as { title: string } | null)?.title ?? "your scholarship";
      const mail = statusEmail(r.full_name, title, r.reference, statusLabels[status]);
      if (await sendEmail(r.email, mail.subject, mail.html)) emailed++;
    }
  }
  await audit(admin.id, `registration_status:${status}`, "registration", ids.length === 1 ? ids[0] : null, { count: ids.length, notify });
  revalidatePath("/admin/registrations");
  return { ok: true, emailed };
}

export async function saveRegistrationNotes(id: string, notes: string): Promise<AdminResult> {
  const admin = await adminOrNull();
  if (!admin) return denied;
  const supabase = await createClient();
  const { error } = await supabase.from("registrations").update({ admin_notes: notes.slice(0, 5000) || null }).eq("id", id);
  if (error) return { ok: false, error: "Could not save notes." };
  await audit(admin.id, "notes", "registration", id);
  return { ok: true };
}

// ───────────── Success stories ─────────────

const testimonialSchema = z.object({
  name: z.string().trim().min(2, "Enter the student's name").max(120),
  scholarship_won: z.string().trim().min(2, "Enter the scholarship won").max(160),
  school: z.string().trim().max(160).optional().transform((v) => v || null),
  quote: z.string().trim().min(10, "Write at least a sentence").max(1200),
  photo_path: z.string().regex(/^testimonials\/[\w-]+\.webp$/).nullable().optional(),
  video_url: z.union([z.literal(""), z.string().trim().url("Enter a full link starting with https://").max(500)]).optional().transform((v) => v || null),
  approved: z.boolean(),
  sort_order: z.coerce.number().int().min(0).max(9999),
});

export async function saveTestimonial(id: string | null, raw: unknown): Promise<AdminResult> {
  const admin = await adminOrNull();
  if (!admin) return denied;
  const p = testimonialSchema.safeParse(raw);
  if (!p.success) {
    const fieldErrors: Record<string, string> = {};
    p.error.issues.forEach((i) => { fieldErrors[String(i.path[0])] = i.message; });
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
  }
  const row = { ...p.data, photo_path: p.data.photo_path ?? null };
  const supabase = await createClient();
  if (id) {
    const { data: old } = await supabase.from("testimonials").select("photo_path").eq("id", id).single();
    const { error } = await supabase.from("testimonials").update(row).eq("id", id);
    if (error) return { ok: false, error: "Could not save." };
    if (old?.photo_path && old.photo_path !== row.photo_path) await supabase.storage.from("site-images").remove([old.photo_path]);
  } else {
    const { data, error } = await supabase.from("testimonials").insert(row).select("id").single();
    if (error || !data) return { ok: false, error: "Could not save." };
    id = data.id;
  }
  await audit(admin.id, "save", "testimonial", id, { name: row.name, approved: row.approved });
  revalidatePath("/admin/testimonials");
  revalidatePath("/testimonials");
  return { ok: true, id: id ?? undefined };
}

export async function deleteTestimonial(id: string): Promise<AdminResult> {
  const admin = await adminOrNull();
  if (!admin) return denied;
  const supabase = await createClient();
  const { data: t } = await supabase.from("testimonials").select("name,photo_path").eq("id", id).single();
  const { error } = await supabase.from("testimonials").delete().eq("id", id);
  if (error) return { ok: false, error: "Could not delete." };
  if (t?.photo_path) await supabase.storage.from("site-images").remove([t.photo_path]);
  await audit(admin.id, "delete", "testimonial", id, { name: t?.name });
  revalidatePath("/admin/testimonials");
  return { ok: true };
}

// ───────────── Contact & social settings ─────────────

const httpsOrEmpty = z.union([z.literal(""), z.string().trim().url().refine((u) => u.startsWith("https://"), "Use an https:// link")]);

export async function saveContactSettings(raw: unknown): Promise<AdminResult> {
  const admin = await adminOrNull();
  if (!admin) return denied;
  const p = z.object({
    phone: z.string().trim().max(30),
    whatsapp: z.string().trim().max(30),
    email: z.union([z.literal(""), z.string().trim().email("Enter a valid email")]),
    address: z.string().trim().max(200),
    facebook: httpsOrEmpty, instagram: httpsOrEmpty, tiktok: httpsOrEmpty, x: httpsOrEmpty, linkedin: httpsOrEmpty, youtube: httpsOrEmpty,
  }).safeParse(raw);
  if (!p.success) {
    const fieldErrors: Record<string, string> = {};
    p.error.issues.forEach((i) => { fieldErrors[String(i.path[0])] = i.message; });
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
  }
  const v = p.data;
  const phone = v.phone ? normalizeUgPhone(v.phone) ?? v.phone : "";
  const whatsapp = v.whatsapp ? normalizeUgPhone(v.whatsapp) : "";
  if (v.whatsapp && !whatsapp) return { ok: false, error: "Enter a valid WhatsApp number.", fieldErrors: { whatsapp: "e.g. 0703 571 121" } };

  const supabase = await createClient();
  const now = new Date().toISOString();
  const { error } = await supabase.from("site_content").upsert([
    { key: "contact", value: { phone, whatsapp, email: v.email, address: v.address }, updated_at: now, updated_by: admin.id },
    { key: "social", value: { facebook: v.facebook, instagram: v.instagram, tiktok: v.tiktok, x: v.x, linkedin: v.linkedin, youtube: v.youtube }, updated_at: now, updated_by: admin.id },
  ]);
  if (error) return { ok: false, error: "Could not save settings." };
  await audit(admin.id, "update", "site_content", "contact");
  revalidatePath("/", "layout");
  return { ok: true };
}
