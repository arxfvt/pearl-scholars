"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { contactSchema, newsletterSchema } from "@/lib/validation";
import { rateLimit, clientIp, verifyTurnstile } from "@/lib/security";
import { sendEmail } from "@/lib/email";
import { getContact } from "@/lib/data/content";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function submitContact(raw: unknown, turnstileToken: string | null): Promise<ActionResult> {
  const p = contactSchema.safeParse(raw);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const ip = await clientIp();
  if (!rateLimit(`contact:${ip}`, 5, 3600_000)) return { ok: false, error: "Too many messages. Please try again later." };
  if (!(await verifyTurnstile(turnstileToken, ip))) return { ok: false, error: "Bot check failed. Please refresh and try again." };

  const { error } = await createAdminClient().from("contact_messages").insert(p.data);
  if (error) return { ok: false, error: "Could not send your message. Please try again." };

  const { email } = await getContact();
  if (email) {
    const safe = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
    await sendEmail(email, `New contact message from ${p.data.name}`, `<p><strong>${safe(p.data.name)}</strong> (${safe(p.data.email)})</p><p>${safe(p.data.message).replace(/\n/g, "<br>")}</p>`);
  }
  return { ok: true };
}

export async function subscribeNewsletter(raw: unknown): Promise<ActionResult> {
  const p = newsletterSchema.safeParse(raw);
  if (!p.success) return { ok: false, error: "Enter a valid email address." };
  const ip = await clientIp();
  if (!rateLimit(`news:${ip}`, 5, 3600_000)) return { ok: false, error: "Too many attempts. Please try again later." };
  const { error } = await createAdminClient().from("newsletter_subscribers").upsert({ email: p.data.email, level: p.data.level ?? null }, { onConflict: "email" });
  return error ? { ok: false, error: "Could not subscribe. Please try again." } : { ok: true };
}
