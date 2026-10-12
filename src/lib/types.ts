// Shared domain types. Mirrors supabase/migrations/0001_init.sql so a future Expo app can reuse them.
export type StudyLevel = "o_level" | "a_level" | "bachelors" | "postgraduate";
export type PublishStatus = "draft" | "published" | "closed";
export type RegistrationStatus = "submitted" | "under_review" | "shortlisted" | "successful" | "not_successful";

export const levelLabels: Record<StudyLevel, string> = {
  o_level: "O-Level",
  a_level: "A-Level",
  bachelors: "Bachelors",
  postgraduate: "Postgraduate",
};

export const statusLabels: Record<RegistrationStatus, string> = {
  submitted: "Submitted",
  under_review: "Under review",
  shortlisted: "Shortlisted",
  successful: "Successful",
  not_successful: "Not successful",
};

export interface Scholarship {
  id: string;
  slug: string;
  title: string;
  provider: string;
  provider_url: string | null;
  country: string;
  summary: string | null;
  description: string | null;
  eligibility: string | null;
  benefits: string | null;
  required_documents: string | null;
  amount_text: string | null;
  levels: StudyLevel[];
  fields: string[];
  tags: string[];
  cover_image_path: string | null;
  deadline: string | null;
  featured: boolean;
  status: PublishStatus;
}

export interface Registration {
  id: string;
  reference: string;
  scholarship_id: string;
  full_name: string;
  email: string;
  phone: string;
  level: StudyLevel;
  institution: string;
  district: string;
  status: RegistrationStatus;
  created_at: string;
}
