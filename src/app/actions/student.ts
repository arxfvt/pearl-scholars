"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { levels, normalizeUgPhone } from "@/lib/validation";

export type StudentResult = { ok: true } | { ok: false; error: string; fieldErrors?: Record<string, string> };

async function currentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

const opt = (max: number) => z.string().trim().max(max).optional().transform((v) => v || null);
const ugPhone = (label: string) => z.string().trim().optional().transform((v, ctx) => {
  if (!v) return null;
  const n = normalizeUgPhone(v);
  if (!n) ctx.addIssue({ code: "custom", message: `Enter a valid Uganda ${label}, e.g. 0772 123 456` });
  return n;
});

const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(120),
  phone: ugPhone("phone number"),
  level: z.union([z.enum(levels), z.literal("")]).transform((v) => v || null),
  institution: opt(160),
  district: opt(80),
  gender: z.union([z.enum(["female", "male", "prefer_not_to_say"]), z.literal("")]).transform((v) => v || null),
  date_of_birth: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]).transform((v) => v || null),
  current_class: opt(40),
  exam_results: opt(200),
  guardian_name: opt(120),
  guardian_phone: ugPhone("guardian phone"),
  alerts_opt_in: z.boolean(),
});

export async function updateProfile(raw: unknown): Promise<StudentResult> {
  const { supabase, user } = await currentUser();
  if (!user) return { ok: false, error: "Please log in again." };
  const p = profileSchema.safeParse(raw);
  if (!p.success) {
    const fieldErrors: Record<string, string> = {};
    p.error.issues.forEach((i) => { fieldErrors[String(i.path[0])] = i.message; });
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
  }
  const { error } = await supabase.from("profiles").update(p.data).eq("id", user.id);
  if (error) return { ok: false, error: "Could not save your profile. Please try again." };
  revalidatePath("/account");
  return { ok: true };
}

export async function toggleSaved(scholarshipId: string): Promise<{ ok: boolean; saved?: boolean; needsLogin?: boolean }> {
  if (!/^[0-9a-f-]{36}$/.test(scholarshipId)) return { ok: false };
  const { supabase, user } = await currentUser();
  if (!user) return { ok: false, needsLogin: true };
  const { data: existing } = await supabase.from("saved_scholarships").select("scholarship_id").eq("user_id", user.id).eq("scholarship_id", scholarshipId).maybeSingle();
  const { error } = existing
    ? await supabase.from("saved_scholarships").delete().eq("user_id", user.id).eq("scholarship_id", scholarshipId)
    : await supabase.from("saved_scholarships").insert({ user_id: user.id, scholarship_id: scholarshipId });
  if (error) return { ok: false };
  revalidatePath("/account");
  return { ok: true, saved: !existing };
}

export async function setAlerts(on: boolean): Promise<StudentResult> {
  const { supabase, user } = await currentUser();
  if (!user) return { ok: false, error: "Please log in again." };
  const { error } = await supabase.from("profiles").update({ alerts_opt_in: on }).eq("id", user.id);
  if (error) return { ok: false, error: "Could not update your alerts." };
  revalidatePath("/account");
  return { ok: true };
}
