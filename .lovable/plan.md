# Cyber School Manager — Phase 1: Self-Serve Signup, Trial & App Shell

A multi-tenant rewrite that removes the two biggest bottlenecks in the current ERP:
your team having to set up every new school, and the admin having to create and reset
every user's password. Phase 1 delivers the full self-serve path — a school signs up,
you approve it with a trial window, the school owner runs a setup wizard, imports their
own data from Excel, and everyone signs in through one link.

## The journey Phase 1 delivers

```text
Public site  →  School signs up  →  You approve + set trial  →  Owner sets up school
                                                                      ↓
                          Everyone signs in at one URL  ←  Excel import  ←  Setup wizard
```

### 1. Public signup (no login)
A landing page explaining the product and a "Start free trial" form: school name, city,
board, approximate student count, owner name, email, phone. Creates a pending school
request and confirms on screen — no account is usable yet.

### 2. Your approval console (super admin)
A private area listing pending requests. For each one you approve or reject, and on
approval you set:
- trial duration (default 14 days, editable per request)
- limits for the trial (max students, max staff, which modules are enabled)
- the plan tier after conversion

Approval provisions the school, creates the owner account, and sends the owner an
invite link to set their password. Global defaults for duration and limits live in a
settings screen so you're not retyping them.

Note on the approval email: sending real emails needs a verified sending domain on the
project. Until that's set up, approvals still work and produce a copyable invite link in
the console; we wire up automated email as soon as the domain is in place.

### 3. Trial state, visible and enforced
Every school carries a status: `pending`, `trial`, `active`, `expired`, `suspended`.
A banner shows days remaining and an "Upgrade / talk to us" action. On expiry the school
drops to read-only — data is never deleted. Trial caps (students/staff) are enforced on
create and on import.

### 4. Onboarding wizard (owner, self-driven)
A checklist the owner completes without anyone from your team:
1. School profile — name, logo, address, board, contact
2. Academic session — start/end dates, current session
3. Structure — classes and sections (prefilled with common Indian school presets, editable)
4. Invite staff — add admin/principal/teacher emails; each gets a set-password link
5. Import data — see below
Progress is saved; the owner can leave and resume. The dashboard shows what's left.

### 5. Self-serve Excel/CSV import
The replacement for emailing formats back and forth:
- Download a template per data type — students, staff, fee heads and structure,
  transport routes and stops, inventory items, teacher work allocation
- Upload the filled file
- Column mapping screen (auto-matched, user can correct)
- Validation preview: row-by-row errors with reasons, downloadable error file
- Import only the valid rows, or fix and re-upload; every run is logged and reversible
In Phase 1 the importer, mapping and validation engine are fully built; the target
tables that exist in this phase are students, staff and classes. Fees, transport,
inventory and allocation templates plug into the same engine as those modules land.

### 6. One login for everyone
A single `/auth` URL per school for admins, teachers, students and parents — no separate
web links. After sign-in the user's roles decide what the menu and dashboard show.
Sign-in options:
- Email + password, with real self-service "forgot password"
- Google one-click
- Hybrid for bulk users: an admin creates or imports staff and student accounts, each
  person receives an invite link and sets their own password. No admin-mediated resets.
Schools are resolved by the account's membership; a user belonging to more than one
school gets a school switcher.

### 7. App shell and dashboard
Collapsible left sidebar with the full module list — Student Lifecycle, Fee,
Examinations, Timetable, Payroll & HR, Transport, Library, Accounts, Inventory,
Teacher Diary, Hostel, Attendance, Communication, Certificates, Settings & Rights.
Menu items are filtered by the signed-in user's role and by which modules the school's
plan enables. Top bar carries school switcher, session selector, search, notifications
and the user menu. Dashboard shows KPI cards, the onboarding checklist while incomplete,
and quick actions. Modules not yet built open a consistent placeholder inside the shell,
so the whole app is walkable.

## Tenancy model

One shared database, `school_id` on every tenant-scoped table, isolation enforced by
row-level security — not one database per school. This removes the schema drift and
per-school deployment burden described in the dossier.

## Design direction

A dense, confident administrative interface, deliberately not generic SaaS: deep
indigo/slate primary with a warm amber accent, data-first spacing, tabular numerals,
clear section rules. All colours as semantic tokens so per-school branding can be
layered on later.

## Database for this phase

- `schools` — name, code, slug, board, city, logo, status, plan tier, trial start/end,
  student/staff caps, `legacy_db_name` for future import traceability
- `school_signup_requests` — the public application: school + contact details, status,
  reviewer, review notes
- `platform_settings` — your global defaults for trial duration, caps, default modules
- `academic_sessions` — school, label, start/end, current flag
- `classes` / `sections` — school-scoped structure
- `profiles` — per user: full name, phone, avatar
- `app_role` enum — `super_admin`, `school_owner`, `school_admin`, `principal`,
  `teacher`, `accountant`, `librarian`, `transport_staff`, `hostel_staff`, `staff`,
  `parent`, `student`
- `user_school_roles` — user × school × role (roles in their own table, never on profiles)
- `invitations` — email, school, role, token, expiry, accepted-at
- `modules` and `plan_modules` — module catalogue and which plans/roles see what
- `onboarding_progress` — wizard step completion per school
- `import_jobs` and `import_rows` — upload history, mapping used, per-row status/errors
- `students` and `staff` — the first real import targets
- Security-definer helpers `has_role(user, school, role)`, `is_member_of_school(...)`,
  `is_super_admin()` used by every policy

RLS everywhere: a user only ever reads rows for schools they belong to; super admin has
a separate, explicit path. Seed data: the module catalogue, default platform settings,
and one demo school so the shell is populated on day one.

## Migrating existing schools' data

Existing schools come across through the same self-serve importer rather than a bespoke
pipeline: export from each SQL Server database to the standard templates, then upload.
`schools.legacy_db_name` and a `legacy_id` on imported rows keep the trail back to the
source. If volumes make that impractical for a particular school, we can add a direct
staging-table load later — but the templated path should cover most of it.

## Technical notes

- TanStack Start + React, Tailwind v4 tokens, shadcn components.
- Public routes: landing, signup, `/auth`, accept-invite, reset-password.
  Everything else under `src/routes/_authenticated/`; super-admin area behind a role gate.
- Email/password plus Google sign-in, both configured this phase.
- Trial and cap enforcement in authenticated server functions plus database policies —
  not client-side checks.
- Import parsing runs in the browser for preview, with the committed insert going
  through a server function so RLS and caps apply.

## Phases after this

1. Student Lifecycle — enquiry, registration, admission, student records
2. Fee — structures, demands, collection, receipts, defaulters
3. Examinations — exam setup, marks entry, report cards
4. Timetable, Transport, Payroll, and the remaining modules
