"use server";

import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { registrationSchema, fileMetaSchema, MAX_FILES, MAX_FILE_BYTES, extFor, sniffMime } from "@/lib/validation";
import { rateLimit, clientIp, verifyTurnstile, signRegistration, verifyRegistrationToken } from "@/lib/security";
import { sendEmail, registrationEmail } from "@/lib/email";

export type StartResult =
  | { ok: true; registrationId: string; reference: string; token: string; uploads: { path: string; token: string }[] }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/** Step 1: validate, create the registration, and hand back signed upload URLs for each file. */
export async function startRegistration(raw: unknown, filesRaw: unknown, turnstileToken: string | null): Promise<StartResult> {
  const parsed = registrationSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((i) => { fieldErrors[String(i.path[0])] = i.message; });
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
  }
  const data = parsed.data;

  const files = Array.isArray(filesRaw) ? filesRaw : [];
  if (files.length > MAX_FILES) return { ok: false, error: `You can upload up to ${MAX_FILES} files.` };
  const metas = [];
  for (const f of files) {
    const m = fileMetaSchema.safeParse(f);
    if (!m.success) return { ok: false, error: "Files must be PDF, JPG or PNG and no larger than 5 MB each." };
    metas.push(m.data);
  }

  const ip = await clientIp();
  if (!rateLimit(`reg:ip:${ip}`, 8, 3600_000) || !rateLimit(`reg:email:${data.email}`, 5, 3600_000))
    return { ok: false, error: "Too many attempts. Please try again later." };
  if (!(await verifyTurnstile(turnstileToken, ip))) return { ok: false, error: "Bot check failed. Please refresh and try again." };

  const admin = createAdminClient();
  const { data: sch } = await admin.from("scholarships").select("id,status,deadline").eq("id", data.scholarshipId).maybeSingle();
  if (!sch || sch.status !== "published" || (sch.deadline && new Date(sch.deadline).getTime() < Date.now()))
    return { ok: false, error: "This scholarship is no longer accepting registrations." };

  const { data: dupe } = await admin.from("registrations").select("id").eq("scholarship_id", sch.id).eq("email", data.email).maybeSingle();
  if (dupe) return { ok: false, error: "You have already registered for this scholarship with this email." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const utm = data.utm ?? {};
  const { data: reg, error } = await admin
    .from("registrations")
    .insert({
      reference: "pending", // replaced by trigger
      scholarship_id: sch.id,
      user_id: user?.id ?? null,
      full_name: data.fullName,
      email: data.email,
      phone: data.phone,
      level: data.level,
      institution: data.institution,
      district: data.district,
      gender: data.gender,
      date_of_birth: data.dateOfBirth,
      current_class: data.currentClass,
      exam_results: data.examResults,
      guardian_name: data.guardianName,
      guardian_phone: data.guardianPhone,
      special_needs: data.specialNeeds,
      heard_from: data.heardFrom,
      consent_given: true,
      utm_source: utm.utm_source ?? null,
      utm_medium: utm.utm_medium ?? null,
      utm_campaign: utm.utm_campaign ?? null,
      utm_term: utm.utm_term ?? null,
      utm_content: utm.utm_content ?? null,
    })
    .select("id,reference")
    .single();
  if (error || !reg) return { ok: false, error: "We could not save your registration. Please try again." };

  const prefix = `${user?.id ?? "guest"}/${reg.id}`;
  const uploads: { path: string; token: string }[] = [];
  for (const m of metas) {
    const path = `${prefix}/${randomUUID()}.${extFor[m.type]}`;
    const { data: signed, error: e } = await admin.storage.from("student-documents").createSignedUploadUrl(path);
    if (e || !signed) return { ok: false, error: "Could not prepare file upload. Please try again." };
    uploads.push({ path, token: signed.token });
  }

  return { ok: true, registrationId: reg.id, reference: reg.reference, token: signRegistration(reg.id), uploads };
}

/** Step 2: after the browser uploaded the files, verify each by content, record them, and send the email. */
export async function finishRegistration(registrationId: string, token: string, paths: string[]): Promise<{ ok: boolean; accepted: number; rejected: number; emailed: boolean }> {
  if (!verifyRegistrationToken(registrationId, token) || paths.length > MAX_FILES) return { ok: false, accepted: 0, rejected: 0, emailed: false };
  const admin = createAdminClient();

  const { data: reg } = await admin.from("registrations").select("id,reference,full_name,email,user_id,scholarship_id").eq("id", registrationId).single();
  if (!reg) return { ok: false, accepted: 0, rejected: 0, emailed: false };
  const prefix = `${reg.user_id ?? "guest"}/${reg.id}/`;

  let accepted = 0, rejected = 0;
  for (const path of paths) {
    if (!path.startsWith(prefix) || path.includes("..")) { rejected++; continue; }
    const { data: blob } = await admin.storage.from("student-documents").download(path);
    if (!blob) { rejected++; continue; }
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const mime = sniffMime(bytes);
    if (!mime || bytes.length > MAX_FILE_BYTES || extFor[mime] !== path.split(".").pop()) {
      await admin.storage.from("student-documents").remove([path]);
      rejected++;
      continue;
    }
    const { error } = await admin.from("registration_documents").insert({
      registration_id: reg.id, storage_path: path, file_name: path.split("/").pop()!, mime_type: mime, size_bytes: bytes.length,
    });
    if (error) { await admin.storage.from("student-documents").remove([path]); rejected++; } else accepted++;
  }

  const { data: sch } = await admin.from("scholarships").select("title").eq("id", reg.scholarship_id).single();
  const mail = registrationEmail(reg.full_name, sch?.title ?? "your scholarship", reg.reference);
  const emailed = await sendEmail(reg.email, mail.subject, mail.html);
  return { ok: true, accepted, rejected, emailed };
}
