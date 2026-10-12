-- Pearl Scholars: initial schema, RLS and storage. Run in Supabase SQL editor (or `supabase db push`).

create extension if not exists pgcrypto;

-- ───────────── Enums ─────────────
create type app_role as enum ('student', 'admin');
create type study_level as enum ('o_level', 'a_level', 'bachelors', 'postgraduate');
create type publish_status as enum ('draft', 'published', 'closed');
create type registration_status as enum ('submitted', 'under_review', 'shortlisted', 'successful', 'not_successful');

-- ───────────── Helpers ─────────────
create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ───────────── Profiles ─────────────
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text check (phone is null or phone ~ '^\+256[0-9]{9}$'),
  level study_level,
  institution text,
  district text,
  alerts_opt_in boolean not null default false,
  role app_role not null default 'student',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated before update on profiles for each row execute function set_updated_at();

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- Students may never change their own role.
create or replace function protect_profile_role() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and not (is_admin() or auth.role() = 'service_role') then
    new.role = old.role;
  end if;
  return new;
end $$;
create trigger profiles_protect_role before update on profiles for each row execute function protect_profile_role();

create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

-- ───────────── Scholarships ─────────────
create table scholarships (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  provider text not null,
  provider_url text,
  country text not null,
  summary text,
  description text,           -- sanitised HTML from the rich-text editor
  eligibility text,
  benefits text,
  required_documents text,
  amount_text text,           -- e.g. "Full tuition + stipend"
  amount_value numeric,
  currency text default 'USD',
  levels study_level[] not null default '{}',
  fields text[] not null default '{}',
  tags text[] not null default '{}',
  cover_image_path text,
  deadline timestamptz,
  featured boolean not null default false,
  status publish_status not null default 'draft',
  is_sample boolean not null default false,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index scholarships_status_deadline_idx on scholarships (status, deadline);
create index scholarships_levels_idx on scholarships using gin (levels);
create index scholarships_fields_idx on scholarships using gin (fields);
create index scholarships_featured_idx on scholarships (featured) where featured;
create trigger scholarships_updated before update on scholarships for each row execute function set_updated_at();

-- Closes scholarships past their deadline. Call from a Supabase cron job (pg_cron) or the admin app.
create or replace function close_expired_scholarships() returns integer language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  update scholarships set status = 'closed' where status = 'published' and deadline is not null and deadline < now();
  get diagnostics n = row_count;
  return n;
end $$;

-- ───────────── Registrations ─────────────
create sequence registration_ref_seq start 1001;

create table registrations (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  scholarship_id uuid not null references scholarships(id) on delete restrict,
  user_id uuid references profiles(id) on delete set null,
  full_name text not null,
  email text not null,
  phone text not null check (phone ~ '^\+256[0-9]{9}$'),
  level study_level not null,
  institution text not null,
  district text not null,
  consent_given boolean not null check (consent_given),
  consent_at timestamptz not null default now(),
  status registration_status not null default 'submitted',
  admin_notes text,
  utm_source text, utm_medium text, utm_campaign text, utm_term text, utm_content text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index registrations_scholarship_idx on registrations (scholarship_id);
create index registrations_user_idx on registrations (user_id);
create index registrations_status_idx on registrations (status);
create index registrations_created_idx on registrations (created_at desc);
create index registrations_email_idx on registrations (lower(email));
create trigger registrations_updated before update on registrations for each row execute function set_updated_at();

create or replace function set_registration_reference() returns trigger language plpgsql as $$
begin
  new.reference = 'PS-' || to_char(now(), 'YY') || '-' || lpad(nextval('registration_ref_seq')::text, 5, '0');
  return new;
end $$;
create trigger registrations_ref before insert on registrations for each row execute function set_registration_reference();

create table registration_documents (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references registrations(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text not null check (mime_type in ('application/pdf', 'image/jpeg', 'image/png')),
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 5242880),
  created_at timestamptz not null default now()
);
create index registration_documents_reg_idx on registration_documents (registration_id);

-- Max 5 documents per registration.
create or replace function limit_registration_documents() returns trigger language plpgsql as $$
begin
  if (select count(*) from registration_documents where registration_id = new.registration_id) >= 5 then
    raise exception 'A registration can have at most 5 documents';
  end if;
  return new;
end $$;
create trigger registration_documents_limit before insert on registration_documents for each row execute function limit_registration_documents();

-- ───────────── Testimonials ─────────────
create table testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  scholarship_won text not null,
  school text,
  quote text not null,
  photo_path text,
  video_url text,
  approved boolean not null default false,
  sort_order integer not null default 0,
  is_sample boolean not null default false,
  created_at timestamptz not null default now()
);
create index testimonials_public_idx on testimonials (approved, sort_order);

-- ───────────── Site content & images ─────────────
create table site_content (
  key text primary key,       -- 'faq', 'contact', 'social', ...
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references profiles(id) on delete set null
);

create table site_images (
  slot text primary key,      -- 'hero', 'banner_home', ...
  storage_path text not null,
  alt text not null default '',
  updated_at timestamptz not null default now()
);

-- ───────────── Engagement ─────────────
create table newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  level study_level,
  created_at timestamptz not null default now()
);

create table contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null check (char_length(message) <= 5000),
  handled boolean not null default false,
  created_at timestamptz not null default now()
);

-- ───────────── Admin management ─────────────
create table admin_invites (
  email text primary key,
  invited_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Promote invited emails to admin when they sign up.
create or replace function apply_admin_invite() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from admin_invites where lower(email) = lower(new.email)) then
    new.role = 'admin';
  end if;
  return new;
end $$;
create trigger on_profile_created_admin_invite before insert on profiles for each row execute function apply_admin_invite();

create table audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references profiles(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id text,
  details jsonb,
  created_at timestamptz not null default now()
);
create index audit_log_created_idx on audit_log (created_at desc);

-- ───────────── Row Level Security ─────────────
alter table profiles enable row level security;
alter table scholarships enable row level security;
alter table registrations enable row level security;
alter table registration_documents enable row level security;
alter table testimonials enable row level security;
alter table site_content enable row level security;
alter table site_images enable row level security;
alter table newsletter_subscribers enable row level security;
alter table contact_messages enable row level security;
alter table admin_invites enable row level security;
alter table audit_log enable row level security;

-- profiles
create policy profiles_select_own on profiles for select using (id = auth.uid() or is_admin());
create policy profiles_update_own on profiles for update using (id = auth.uid() or is_admin()) with check (id = auth.uid() or is_admin());

-- scholarships: public reads published/closed; admins do everything
create policy scholarships_public_read on scholarships for select using (status in ('published', 'closed') or is_admin());
create policy scholarships_admin_write on scholarships for all using (is_admin()) with check (is_admin());

-- registrations: students see their own; admins see and update all.
-- Guest submissions are inserted server-side with the service role (after Turnstile + rate limit checks).
create policy registrations_select on registrations for select using (user_id = auth.uid() or is_admin());
create policy registrations_insert_own on registrations for insert with check (user_id = auth.uid());
create policy registrations_admin_update on registrations for update using (is_admin()) with check (is_admin());
create policy registrations_admin_delete on registrations for delete using (is_admin());

create policy reg_docs_select on registration_documents for select
  using (is_admin() or exists (select 1 from registrations r where r.id = registration_id and r.user_id = auth.uid()));
create policy reg_docs_admin_write on registration_documents for all using (is_admin()) with check (is_admin());

-- testimonials: public sees approved only
create policy testimonials_public_read on testimonials for select using (approved or is_admin());
create policy testimonials_admin_write on testimonials for all using (is_admin()) with check (is_admin());

-- content & images: public read, admin write
create policy site_content_read on site_content for select using (true);
create policy site_content_admin_write on site_content for all using (is_admin()) with check (is_admin());
create policy site_images_read on site_images for select using (true);
create policy site_images_admin_write on site_images for all using (is_admin()) with check (is_admin());

-- newsletter / contact: inserts go through server actions (service role); admins read
create policy newsletter_admin on newsletter_subscribers for all using (is_admin()) with check (is_admin());
create policy contact_admin on contact_messages for all using (is_admin()) with check (is_admin());

-- admin tables
create policy admin_invites_admin on admin_invites for all using (is_admin()) with check (is_admin());
create policy audit_log_admin_read on audit_log for select using (is_admin());
create policy audit_log_admin_insert on audit_log for insert with check (is_admin() and actor_id = auth.uid());

-- ───────────── Storage ─────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('student-documents', 'student-documents', false, 5242880, array['application/pdf', 'image/jpeg', 'image/png']),
  ('site-images', 'site-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Documents: path convention  <user_id or 'guest'>/<registration_id>/<file>. Uploads by service role only.
create policy docs_owner_read on storage.objects for select
  using (bucket_id = 'student-documents' and ((storage.foldername(name))[1] = auth.uid()::text or is_admin()));
create policy docs_admin_all on storage.objects for all
  using (bucket_id = 'student-documents' and is_admin()) with check (bucket_id = 'student-documents' and is_admin());

create policy site_images_public_read on storage.objects for select using (bucket_id = 'site-images');
create policy site_images_admin_write on storage.objects for all
  using (bucket_id = 'site-images' and is_admin()) with check (bucket_id = 'site-images' and is_admin());
