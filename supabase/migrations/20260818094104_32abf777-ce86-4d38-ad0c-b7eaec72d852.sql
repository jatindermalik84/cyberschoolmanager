-- ============ ENUM ============
create type public.app_role as enum (
  'super_admin','school_owner','school_admin','principal','teacher',
  'accountant','librarian','transport_staff','hostel_staff','staff','parent','student'
);

-- ============ UPDATED_AT HELPER ============
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============ SCHOOLS ============
create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  city text,
  state text,
  board text,
  logo_url text,
  status text not null default 'active',
  legacy_db_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.schools to authenticated;
grant all on public.schools to service_role;
alter table public.schools enable row level security;

-- ============ PROFILES ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

-- ============ USER SCHOOL ROLES ============
create table public.user_school_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  school_id uuid references public.schools(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, school_id, role)
);
grant select on public.user_school_roles to authenticated;
grant all on public.user_school_roles to service_role;
alter table public.user_school_roles enable row level security;

-- ============ SECURITY DEFINER HELPERS ============
create or replace function public.is_super_admin(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_school_roles where user_id = _user_id and role = 'super_admin');
$$;

create or replace function public.is_member_of_school(_user_id uuid, _school_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_school_roles
    where user_id = _user_id and (school_id = _school_id or role = 'super_admin')
  );
$$;

create or replace function public.has_role(_user_id uuid, _school_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_school_roles
    where user_id = _user_id and role = _role and (school_id = _school_id or role = 'super_admin')
  );
$$;

-- ============ POLICIES: core ============
create policy "Members can view their schools" on public.schools
  for select to authenticated using (public.is_member_of_school(auth.uid(), id));

create policy "Users can view their own profile" on public.profiles
  for select to authenticated using (auth.uid() = id);
create policy "Users can insert their own profile" on public.profiles
  for insert to authenticated with check (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create policy "Users can view their own roles" on public.user_school_roles
  for select to authenticated using (auth.uid() = user_id or public.is_super_admin(auth.uid()));

-- ============ ACADEMIC SESSIONS ============
create table public.academic_sessions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  label text not null,
  start_date date not null,
  end_date date not null,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.academic_sessions to authenticated;
grant all on public.academic_sessions to service_role;
alter table public.academic_sessions enable row level security;
create policy "Members can view sessions" on public.academic_sessions
  for select to authenticated using (public.is_member_of_school(auth.uid(), school_id));

-- ============ MODULES ============
create table public.modules (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  icon text not null default 'Square',
  route text not null,
  nav_group text not null,
  sort_order integer not null default 0,
  allowed_roles public.app_role[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.modules to authenticated;
grant all on public.modules to service_role;
alter table public.modules enable row level security;
create policy "Authenticated can view modules" on public.modules
  for select to authenticated using (true);

-- ============ CLASSES ============
create table public.classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  section text,
  sort_order integer not null default 0,
  strength integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.classes to authenticated;
grant all on public.classes to service_role;
alter table public.classes enable row level security;
create policy "Members can view classes" on public.classes
  for select to authenticated using (public.is_member_of_school(auth.uid(), school_id));

-- ============ STUDENTS ============
create table public.students (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  admission_no text not null,
  full_name text not null,
  class_id uuid references public.classes(id) on delete set null,
  gender text,
  guardian_name text,
  contact_phone text,
  status text not null default 'active',
  legacy_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, admission_no)
);
grant select on public.students to authenticated;
grant all on public.students to service_role;
alter table public.students enable row level security;
create policy "Members can view students" on public.students
  for select to authenticated using (public.is_member_of_school(auth.uid(), school_id));

-- ============ STAFF ============
create table public.staff (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  employee_code text not null,
  full_name text not null,
  designation text,
  department text,
  contact_phone text,
  status text not null default 'active',
  legacy_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, employee_code)
);
grant select on public.staff to authenticated;
grant all on public.staff to service_role;
alter table public.staff enable row level security;
create policy "Members can view staff" on public.staff
  for select to authenticated using (public.is_member_of_school(auth.uid(), school_id));

-- ============ FEE COLLECTION SUMMARY ============
create table public.fee_collection_summary (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  session_id uuid references public.academic_sessions(id) on delete cascade,
  month_start date not null,
  collected_amount numeric(14,2) not null default 0,
  demand_amount numeric(14,2) not null default 0,
  defaulter_count integer not null default 0,
  created_at timestamptz not null default now(),
  unique (school_id, month_start)
);
grant select on public.fee_collection_summary to authenticated;
grant all on public.fee_collection_summary to service_role;
alter table public.fee_collection_summary enable row level security;
create policy "Members can view fee summary" on public.fee_collection_summary
  for select to authenticated using (public.is_member_of_school(auth.uid(), school_id));

-- ============ ATTENDANCE SUMMARY ============
create table public.attendance_summary (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  attendance_date date not null,
  present_count integer not null default 0,
  absent_count integer not null default 0,
  total_count integer not null default 0,
  created_at timestamptz not null default now(),
  unique (school_id, attendance_date)
);
grant select on public.attendance_summary to authenticated;
grant all on public.attendance_summary to service_role;
alter table public.attendance_summary enable row level security;
create policy "Members can view attendance summary" on public.attendance_summary
  for select to authenticated using (public.is_member_of_school(auth.uid(), school_id));

-- ============ ACTIVITY LOG ============
create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  actor_name text not null,
  action text not null,
  entity text,
  occurred_at timestamptz not null default now()
);
grant select on public.activity_log to authenticated;
grant all on public.activity_log to service_role;
alter table public.activity_log enable row level security;
create policy "Members can view activity" on public.activity_log
  for select to authenticated using (public.is_member_of_school(auth.uid(), school_id));

-- ============ TRIGGERS ============
create trigger update_schools_updated_at before update on public.schools
  for each row execute function public.update_updated_at_column();
create trigger update_profiles_updated_at before update on public.profiles
  for each row execute function public.update_updated_at_column();
create trigger update_sessions_updated_at before update on public.academic_sessions
  for each row execute function public.update_updated_at_column();
create trigger update_classes_updated_at before update on public.classes
  for each row execute function public.update_updated_at_column();
create trigger update_students_updated_at before update on public.students
  for each row execute function public.update_updated_at_column();
create trigger update_staff_updated_at before update on public.staff
  for each row execute function public.update_updated_at_column();

-- ============ AUTO PROFILE ON SIGNUP ============
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;

  -- Every new signup joins the demo school as a school admin for the prototype
  insert into public.user_school_roles (user_id, school_id, role)
  select new.id, s.id, 'school_admin'::public.app_role
  from public.schools s where s.code = 'DEMO'
  on conflict do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ SEED: MODULES ============
insert into public.modules (key, name, description, icon, route, nav_group, sort_order, allowed_roles) values
('student_lifecycle','Student Lifecycle','Enquiry to admission, plus day-to-day student records','GraduationCap','/students','Academics',10,'{super_admin,school_owner,school_admin,principal,teacher}'),
('attendance','Attendance','Daily capture, consolidation and absence alerts','CalendarCheck','/attendance','Academics',20,'{super_admin,school_owner,school_admin,principal,teacher}'),
('examinations','Examinations','Exam setup, marks entry, grading, report cards','ClipboardList','/examinations','Academics',30,'{super_admin,school_owner,school_admin,principal,teacher}'),
('timetable','Timetable','Periods, teacher allotment, generation, substitution','CalendarRange','/timetable','Academics',40,'{super_admin,school_owner,school_admin,principal,teacher}'),
('teacher_diary','Teacher Diary','Lesson planning, inspection, PTM, weak and gifted tracking','NotebookPen','/teacher-diary','Academics',50,'{super_admin,school_owner,school_admin,principal,teacher}'),
('fee','Fee','Structure, demands, challans, collection, concessions, fines','IndianRupee','/fee','Finance',60,'{super_admin,school_owner,school_admin,principal,accountant}'),
('accounts','Accounts','Ledgers, vouchers, trial balance, balance sheet','BookOpenCheck','/accounts','Finance',70,'{super_admin,school_owner,school_admin,accountant}'),
('transport','Transport','Routes, vehicles, documents, maintenance, assignment','Bus','/transport','Operations',80,'{super_admin,school_owner,school_admin,transport_staff}'),
('library','Library','Catalogue, accession, issue and return, stock verification','Library','/library','Operations',90,'{super_admin,school_owner,school_admin,librarian}'),
('hostel','Hostel','Rooms, floors, mess, amenities, allocation, outing register','BedDouble','/hostel','Operations',100,'{super_admin,school_owner,school_admin,hostel_staff}'),
('inventory','Inventory & Procurement','Items, stock, sales to students, purchase to GRN','Package','/inventory','Operations',110,'{super_admin,school_owner,school_admin,accountant}'),
('payroll','Payroll & HR','Employee master, salary heads, statutory, leave, biometric','Users','/payroll','People',120,'{super_admin,school_owner,school_admin,accountant}'),
('communication','Communication','SMS and email automation for attendance, birthdays, fees','MessageSquare','/communication','Communication',130,'{super_admin,school_owner,school_admin,principal}'),
('certificates','Certificates','Issuance, approval workflow, public QR verification','BadgeCheck','/certificates','Communication',140,'{super_admin,school_owner,school_admin,principal}'),
('settings_school','School Profile','School details, branding and contact','Building2','/settings/school','Settings',150,'{super_admin,school_owner,school_admin}'),
('settings_sessions','Academic Sessions','Session setup and year-end roll-over','CalendarCog','/settings/sessions','Settings',160,'{super_admin,school_owner,school_admin}'),
('settings_users','Users & Roles','Users, profiles and page-level permissions','ShieldCheck','/settings/users','Settings',170,'{super_admin,school_owner,school_admin}');

-- ============ SEED: DEMO SCHOOL ============
insert into public.schools (id, name, code, city, state, board, status, legacy_db_name)
values ('11111111-1111-4111-8111-111111111111','Gurukul Global School','DEMO','Chandigarh','Punjab','CBSE','active','dbGurukulGlobalSchool');

insert into public.academic_sessions (id, school_id, label, start_date, end_date, is_current) values
('22222222-2222-4222-8222-222222222221','11111111-1111-4111-8111-111111111111','2026-27','2026-04-01','2027-03-31',true),
('22222222-2222-4222-8222-222222222222','11111111-1111-4111-8111-111111111111','2025-26','2025-04-01','2026-03-31',false),
('22222222-2222-4222-8222-222222222223','11111111-1111-4111-8111-111111111111','2024-25','2024-04-01','2025-03-31',false);

insert into public.classes (school_id, name, section, sort_order, strength) values
('11111111-1111-4111-8111-111111111111','Nursery','A',10,48),
('11111111-1111-4111-8111-111111111111','LKG','A',20,52),
('11111111-1111-4111-8111-111111111111','UKG','A',30,55),
('11111111-1111-4111-8111-111111111111','Class I','A',40,61),
('11111111-1111-4111-8111-111111111111','Class II','A',50,58),
('11111111-1111-4111-8111-111111111111','Class III','A',60,64),
('11111111-1111-4111-8111-111111111111','Class IV','A',70,60),
('11111111-1111-4111-8111-111111111111','Class V','A',80,57),
('11111111-1111-4111-8111-111111111111','Class VI','A',90,63),
('11111111-1111-4111-8111-111111111111','Class VII','A',100,59),
('11111111-1111-4111-8111-111111111111','Class VIII','A',110,55),
('11111111-1111-4111-8111-111111111111','Class IX','A',120,52),
('11111111-1111-4111-8111-111111111111','Class X','A',130,49),
('11111111-1111-4111-8111-111111111111','Class XI','Science',140,44),
('11111111-1111-4111-8111-111111111111','Class XII','Science',150,41);

insert into public.fee_collection_summary (school_id, session_id, month_start, collected_amount, demand_amount, defaulter_count) values
('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222221','2026-04-01',4820000,5250000,86),
('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222221','2026-05-01',4610000,5250000,102),
('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222221','2026-06-01',5010000,5300000,71),
('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222221','2026-07-01',4930000,5300000,79),
('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222221','2026-08-01',3180000,5300000,134);

insert into public.attendance_summary (school_id, attendance_date, present_count, absent_count, total_count) values
('11111111-1111-4111-8111-111111111111', current_date, 742, 76, 818),
('11111111-1111-4111-8111-111111111111', current_date - 1, 761, 57, 818),
('11111111-1111-4111-8111-111111111111', current_date - 2, 728, 90, 818),
('11111111-1111-4111-8111-111111111111', current_date - 3, 754, 64, 818),
('11111111-1111-4111-8111-111111111111', current_date - 4, 769, 49, 818);

insert into public.staff (school_id, employee_code, full_name, designation, department) values
('11111111-1111-4111-8111-111111111111','EMP001','Anita Sharma','Principal','Administration'),
('11111111-1111-4111-8111-111111111111','EMP002','Rajesh Verma','Vice Principal','Administration'),
('11111111-1111-4111-8111-111111111111','EMP003','Meena Kapoor','PGT Mathematics','Academics'),
('11111111-1111-4111-8111-111111111111','EMP004','Sandeep Rana','TGT Science','Academics'),
('11111111-1111-4111-8111-111111111111','EMP005','Pooja Bansal','Accountant','Accounts'),
('11111111-1111-4111-8111-111111111111','EMP006','Harpreet Singh','Transport Incharge','Transport'),
('11111111-1111-4111-8111-111111111111','EMP007','Kavita Joshi','Librarian','Library'),
('11111111-1111-4111-8111-111111111111','EMP008','Nitin Malhotra','PRT English','Academics');

insert into public.students (school_id, admission_no, full_name, class_id, gender, guardian_name, contact_phone)
select '11111111-1111-4111-8111-111111111111',
       'ADM' || lpad(g::text, 4, '0'),
       (array['Aarav Gupta','Diya Sharma','Vihaan Kaur','Anaya Mehta','Kabir Singh','Ishita Rao','Arjun Nair','Myra Bansal','Reyansh Jain','Saanvi Chopra'])[1 + (g % 10)],
       (select id from public.classes where school_id = '11111111-1111-4111-8111-111111111111' order by sort_order offset (g % 15) limit 1),
       case when g % 2 = 0 then 'Male' else 'Female' end,
       (array['Rakesh Gupta','Suresh Sharma','Jaspreet Kaur','Nikhil Mehta','Amrit Singh'])[1 + (g % 5)],
       '98' || lpad((10000000 + g * 137)::text, 8, '0')
from generate_series(1, 40) g;

insert into public.activity_log (school_id, actor_name, action, entity, occurred_at) values
('11111111-1111-4111-8111-111111111111','Pooja Bansal','Collected fee receipt #46198','Fee', now() - interval '12 minutes'),
('11111111-1111-4111-8111-111111111111','Anita Sharma','Approved transfer certificate','Certificates', now() - interval '48 minutes'),
('11111111-1111-4111-8111-111111111111','Meena Kapoor','Submitted Class X marks — Mathematics','Examinations', now() - interval '2 hours'),
('11111111-1111-4111-8111-111111111111','Harpreet Singh','Updated Route 7 vehicle document','Transport', now() - interval '4 hours'),
('11111111-1111-4111-8111-111111111111','Nitin Malhotra','Marked attendance for Class IV-A','Attendance', now() - interval '6 hours'),
('11111111-1111-4111-8111-111111111111','Kavita Joshi','Issued 12 books to Class VIII','Library', now() - interval '1 day');