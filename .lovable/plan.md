# Cyber School Manager — Phase 1 Prototype (Shell)

A modern, multi-tenant rewrite of the Cyber School Manager ERP. This first phase builds the
skeleton everything else hangs off: sign-in, a school-aware dashboard, and the full module
navigation. No module logic yet — just real auth, real tenancy, and clickable structure.

## What you'll be able to do after this phase

- Sign in with email/password or Google and land in the ERP shell.
- See which school (tenant) you're working in, and switch if your account belongs to more than one.
- Browse the complete module menu — Fee, Examinations, Timetable, Payroll & HR, Transport,
  Student Lifecycle, Library, Accounts, Inventory, Teacher Diary, Hostel, Attendance,
  Communication, Certificates, Security & Rights.
- Land on a dashboard with KPI cards (students, staff, fee collection, attendance) and
  quick actions, reading real rows from the new database.
- Every module page opens to a consistent "coming soon" placeholder inside the shell, so
  navigation is fully walkable.

## Tenancy model

Unlike the legacy one-database-per-school design, this rewrite uses a single shared database
with a `school_id` on every tenant-scoped table, enforced by row-level security. A user can be
attached to one or more schools with a role per school. This removes the per-school schema
drift described in the dossier while keeping data isolation strict.

## Screens

```text
/auth                     Sign in / sign up (public)
/                         Redirects to /dashboard when signed in, else /auth
/dashboard                KPI cards, quick actions, recent activity
/students /fees /exams …  One route per module, placeholder inside shell
/settings/school          School profile, academic sessions
/settings/users           Users, roles, module permissions (read-only in this phase)
```

The shell is a collapsible left sidebar with grouped modules, a top bar with school switcher,
academic-session selector, search, notifications and user menu. Responsive: sidebar becomes a
drawer on mobile.

## Design direction

Deliberately not generic-SaaS. A dense, confident administrative interface: deep indigo/slate
primary with a warm amber accent, tight data-first spacing, tabular numerals for figures,
clear section rules. All colours as semantic tokens so a per-school theme can be layered later.

## Database (this phase only)

- `schools` — name, code, subdomain, address, logo, active flag
- `academic_sessions` — school, label, start/end dates, current flag
- `profiles` — one row per user: full name, phone, avatar
- `app_role` enum — `super_admin`, `school_admin`, `principal`, `teacher`, `accountant`,
  `librarian`, `transport`, `hostel`, `staff`, `parent`, `student`
- `user_school_roles` — user × school × role (roles kept in their own table, never on profiles)
- `has_role(user_id, school_id, role)` and `is_member_of_school(user_id, school_id)` —
  security-definer helpers used by every policy
- `modules` + `role_module_access` — drives which menu items a role sees

RLS on all tables, scoped so a user only ever reads rows for schools they belong to.
Seed data: one demo school, current academic session, and the module catalogue.

## Data import from the existing SQL Server databases

Real import is in scope for the project but not for this phase — it needs the target schema
for each module to exist first. Phase 1 lays the groundwork: `schools` and `academic_sessions`
carry a `legacy_db_name` / `legacy_id` column so imported rows can be traced back to the
source school database. We'll design the actual extract-and-load pipeline (CSV/JSON export
from SQL Server → staging tables → mapped insert) once the first business module's schema
lands, starting with Student Lifecycle.

## Technical notes

- TanStack Start + React, Tailwind v4 tokens, shadcn components.
- Protected pages under `src/routes/_authenticated/`; `/auth` stays public.
- Google sign-in enabled and configured alongside email/password.
- Active school and session held in a React context, persisted per user.
- Dashboard KPIs read through authenticated server functions so RLS applies as the user.

## Suggested next phases

1. Student Lifecycle — enquiry, registration, admission, student records + first real import
2. Fee — structures, demands, collection, receipts, defaulters
3. Examinations — exam setup, marks entry, report cards
