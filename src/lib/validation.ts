import { z } from "zod";

export const levels = ["o_level", "a_level", "bachelors", "postgraduate"] as const;

/** Accepts 0772123456, 772123456, 256772123456, +256 772 123 456 and returns +256772123456, or null. */
export function normalizeUgPhone(input: string): string | null {
  const digits = input.replace(/[\s\-().]/g, "");
  let national: string | null = null;
  if (/^\+256\d{9}$/.test(digits)) national = digits.slice(4);
  else if (/^256\d{9}$/.test(digits)) national = digits.slice(3);
  else if (/^0\d{9}$/.test(digits)) national = digits.slice(1);
  else if (/^\d{9}$/.test(digits)) national = digits;
  return national && /^[1-9]/.test(national) ? `+256${national}` : null;
}

const text = (label: string, max = 120) =>
  z.string().trim().min(2, `Enter ${label}`).max(max, `${label} is too long`);

export const registrationSchema = z.object({
  scholarshipId: z.string().uuid(),
  fullName: text("your full name"),
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(200),
  phone: z
    .string()
    .trim()
    .transform((v, ctx) => {
      const n = normalizeUgPhone(v);
      if (!n) ctx.addIssue({ code: "custom", message: "Enter a valid Uganda number, e.g. +256 772 123 456" });
      return n ?? "";
    }),
  level: z.enum(levels, { message: "Choose your level of study" }),
  institution: text("your school or institution"),
  district: text("your district", 80),
  consent: z.literal(true, { message: "You must agree to continue" }),
  utm: z.record(z.string(), z.string().max(200)).optional(),
});
export type RegistrationInput = z.input<typeof registrationSchema>;

export const MAX_FILES = 5;
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const allowedMime = ["application/pdf", "image/jpeg", "image/png"] as const;
export const extFor: Record<string, string> = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png" };

export const fileMetaSchema = z.object({
  name: z.string().max(200),
  type: z.enum(allowedMime),
  size: z.number().int().positive().max(MAX_FILE_BYTES),
});

export const contactSchema = z.object({
  name: text("your name"),
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(200),
  message: z.string().trim().min(10, "Write at least 10 characters").max(5000),
});

export const newsletterSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(200),
  level: z.enum(levels).optional(),
});

/** Detect the real file type from its first bytes. */
export function sniffMime(bytes: Uint8Array): (typeof allowedMime)[number] | null {
  const b = bytes;
  if (b.length >= 4 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return "application/pdf";
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) return "image/png";
  return null;
}

const optionalText = (max: number) => z.string().trim().max(max).optional().transform((v) => (v ? v : null));
const list = z.string().optional().transform((v) => (v ?? "").split(",").map((x) => x.trim()).filter(Boolean).slice(0, 20));

export const scholarshipSchema = z.object({
  title: z.string().trim().min(5, "Title is too short").max(160),
  slug: z.string().trim().max(120).optional(),
  provider: z.string().trim().min(2, "Enter the provider").max(160),
  provider_url: z.union([z.literal(""), z.string().trim().url("Enter a full link starting with https://").max(500)]).optional().transform((v) => v || null),
  country: z.string().trim().min(2, "Enter the country").max(80),
  summary: optionalText(300),
  description: optionalText(20000),
  eligibility: optionalText(8000),
  benefits: optionalText(8000),
  required_documents: optionalText(4000),
  amount_text: optionalText(120),
  levels: z.array(z.enum(levels)).min(1, "Pick at least one level"),
  fields: list,
  tags: list,
  cover_image_path: z.string().max(300).regex(/^covers\/[\w-]+\.webp$/).nullable().optional(),
  deadline: z.string().optional().transform((v) => (v ? v : null)), // "YYYY-MM-DDTHH:mm" in Kampala time
  featured: z.boolean(),
  status: z.enum(["draft", "published", "closed"]),
});
export type ScholarshipInput = z.input<typeof scholarshipSchema>;
