"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { scholarshipSchema } from "@/lib/validation";
import { slugify } from "@/lib/format";

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
  if (v.status === "published" && !v.provider_url)
    return { ok: false, error: "Add the official provider link before publishing, so students can verify it.", fieldErrors: { provider_url: "Required to publish" } };

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
  if (status === "published") {
    const { data } = await supabase.from("scholarships").select("provider_url").eq("id", id).single();
    if (!data?.provider_url) return { ok: false, error: "Add the official provider link before publishing." };
  }
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
