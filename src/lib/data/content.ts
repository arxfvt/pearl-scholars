import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { site } from "@/lib/site";

export interface Faq { q: string; a: string }
export interface Testimonial {
  id: string; name: string; scholarship_won: string; school: string | null; quote: string;
  photo_path: string | null; video_url: string | null;
}

export async function getFaq(): Promise<Faq[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("site_content").select("value").eq("key", "faq").maybeSingle();
  return Array.isArray(data?.value) ? (data!.value as Faq[]) : [];
}

export async function getContact() {
  const supabase = await createClient();
  const { data } = await supabase.from("site_content").select("key,value").in("key", ["contact", "social"]);
  const contact = (data?.find((r) => r.key === "contact")?.value ?? {}) as Record<string, string>;
  const social = (data?.find((r) => r.key === "social")?.value ?? {}) as Record<string, string>;
  return {
    phone: contact.phone || site.phone,
    whatsapp: (contact.whatsapp || site.whatsapp).replace(/\D/g, ""),
    email: contact.email || site.email,
    address: contact.address || site.address,
    social: Object.fromEntries(Object.entries(social).filter(([, v]) => v)) as Record<string, string>,
  };
}

export async function getTestimonials(limit?: number): Promise<Testimonial[]> {
  const supabase = await createClient();
  let q = supabase.from("testimonials").select("id,name,scholarship_won,school,quote,photo_path,video_url").eq("approved", true).order("sort_order");
  if (limit) q = q.limit(limit);
  const { data } = await q;
  return (data ?? []) as Testimonial[];
}

/** Public numbers for the stats strip. Only returns values that are really > 0. */
export async function getStats() {
  const admin = createAdminClient();
  const [reg, sch, win] = await Promise.all([
    admin.from("registrations").select("id", { count: "exact", head: true }),
    admin.from("scholarships").select("id", { count: "exact", head: true }).in("status", ["published", "closed"]),
    admin.from("registrations").select("id", { count: "exact", head: true }).eq("status", "successful"),
  ]);
  return [
    { label: "Students registered", value: reg.count ?? 0 },
    { label: "Scholarships listed", value: sch.count ?? 0 },
    { label: "Successful students", value: win.count ?? 0 },
  ].filter((s) => s.value > 0);
}

export function publicImageUrl(path: string | null | undefined) {
  if (!path) return null;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/site-images/${path}`;
}

/** Uploaded cover if present, otherwise a generic on-brand illustration for the scholarship's first level. */
export function coverFor(s: { cover_image_path: string | null; levels: string[] }) {
  return publicImageUrl(s.cover_image_path) ?? `/covers/${s.levels[0] ?? "default"}.svg`;
}

export const SITE_IMAGE_SLOTS = {
  hero: { label: "Home page hero background", hint: "Shown behind the dark hero at the top of the home page. Use a wide photo (at least 1600 px).", width: 1920 },
} as const;
export type SiteImageSlot = keyof typeof SITE_IMAGE_SLOTS;

export async function getSiteImage(slot: SiteImageSlot) {
  const supabase = await createClient();
  const { data } = await supabase.from("site_images").select("storage_path,alt").eq("slot", slot).maybeSingle();
  return data ? { url: publicImageUrl(data.storage_path)!, alt: data.alt, path: data.storage_path } : null;
}
