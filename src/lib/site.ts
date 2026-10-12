export const site = {
  name: "Pearl Scholars",
  tagline: "Your Fursa awaits.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
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
