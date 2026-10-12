import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";

// Best-effort in-memory limiter (per server instance). Swap for Upstash/Redis if abuse appears.
const hits = new Map<string, number[]>();

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
  return true;
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

/** Cloudflare Turnstile. Skipped (returns true) when no secret is configured, e.g. local dev. */
export async function verifyTurnstile(token: string | null | undefined, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

const hmacKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY ?? "dev-only-key";

/** Stateless proof that the caller created this registration (guests have no session). */
export function signRegistration(registrationId: string): string {
  return createHmac("sha256", hmacKey()).update(registrationId).digest("hex");
}

export function verifyRegistrationToken(registrationId: string, token: string): boolean {
  const a = Buffer.from(signRegistration(registrationId));
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}
