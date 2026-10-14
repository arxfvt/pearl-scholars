-- Pearl Scholars 0003: richer student profiles (autofill) and saved scholarships. Safe to run more than once.

alter table profiles add column if not exists gender text check (gender in ('female', 'male', 'prefer_not_to_say'));
alter table profiles add column if not exists date_of_birth date;
alter table profiles add column if not exists current_class text;
alter table profiles add column if not exists exam_results text;
alter table profiles add column if not exists guardian_name text;
alter table profiles add column if not exists guardian_phone text check (guardian_phone is null or guardian_phone ~ '^\+256[0-9]{9}$');

-- Students can bookmark scholarships to come back to before the deadline.
create table if not exists saved_scholarships (
  user_id uuid not null references profiles(id) on delete cascade,
  scholarship_id uuid not null references scholarships(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, scholarship_id)
);
create index if not exists saved_scholarships_scholarship_idx on saved_scholarships (scholarship_id);

alter table saved_scholarships enable row level security;
drop policy if exists saved_own_select on saved_scholarships;
drop policy if exists saved_own_insert on saved_scholarships;
drop policy if exists saved_own_delete on saved_scholarships;
drop policy if exists saved_admin_read on saved_scholarships;
create policy saved_own_select on saved_scholarships for select using (user_id = auth.uid());
create policy saved_own_insert on saved_scholarships for insert with check (user_id = auth.uid());
create policy saved_own_delete on saved_scholarships for delete using (user_id = auth.uid());
create policy saved_admin_read on saved_scholarships for select using (is_admin());
