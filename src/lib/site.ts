/** Absolute site URL. Tolerates a missing scheme or trailing slash, falls back to Netlify's own URL, then localhost. */
function resolveSiteUrl(): string {
  for (const raw of [process.env.NEXT_PUBLIC_SITE_URL, process.env.URL]) {
    const v = raw?.trim().replace(/^[A-Z_]+=/, ""); // tolerate "KEY=value" pasted into the value box
    if (!v) continue;
    try {
      return new URL(/^https?:\/\//.test(v) ? v : `https://${v}`).origin;
    } catch {
      /* try the next candidate */
    }
  }
  return "http://localhost:3000";
}

export const site = {
  name: "Pearl Scholars",
  tagline: "Your Fursa awaits.",
  url: resolveSiteUrl(),
  phone: process.env.NEXT_PUBLIC_CLIENT_PHONE ?? "",
  whatsapp: (process.env.NEXT_PUBLIC_CLIENT_WHATSAPP ?? "").replace(/\D/g, ""),
  email: process.env.NEXT_PUBLIC_CLIENT_EMAIL ?? "",
  address: "Mengo, P.O. Box 24930, Kampala, Uganda",
};

export const nav = [
  { href: "/scholarships", label: "Scholarships" },
  { href: "/testimonials", label: "Success stories" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];
