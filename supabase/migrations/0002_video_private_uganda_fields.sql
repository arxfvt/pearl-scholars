-- Pearl Scholars 0002: scholarship video + private sponsors, Uganda planning fields on registrations, contact number.
-- Safe to run more than once.

-- Scholarships: promo video link and option to hide the provider's identity.
alter table scholarships add column if not exists video_url text;
alter table scholarships add column if not exists provider_hidden boolean not null default false;

-- Registrations: information that helps plan support for students in Uganda.
alter table registrations add column if not exists gender text check (gender in ('female', 'male', 'prefer_not_to_say'));
alter table registrations add column if not exists date_of_birth date;
alter table registrations add column if not exists current_class text;
alter table registrations add column if not exists exam_results text;
alter table registrations add column if not exists guardian_name text;
alter table registrations add column if not exists guardian_phone text check (guardian_phone is null or guardian_phone ~ '^\+256[0-9]{9}$');
alter table registrations add column if not exists special_needs text;
alter table registrations add column if not exists heard_from text;

create index if not exists registrations_district_idx on registrations (district);
create index if not exists registrations_gender_idx on registrations (gender);

-- Contact number supplied by the client (phone + WhatsApp). Editable later in Admin > Settings.
insert into site_content (key, value)
values ('contact', '{"phone":"+256703571121","whatsapp":"+256703571121","email":"","address":"Mengo, P.O. Box 24930, Kampala, Uganda"}')
on conflict (key) do update
  set value = site_content.value || '{"phone":"+256703571121","whatsapp":"+256703571121"}'::jsonb,
      updated_at = now();
