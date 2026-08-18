# Cyber School Manager — Prototype (Login, Dashboard, Navigation)

A clickable prototype of the rewritten ERP. Scope is deliberately narrow: prove the look,
the shell and the navigation. No module logic, no signup flow, no imports yet.

## What the prototype contains

**Login page** — single sign-in screen for the whole school (admins, teachers, students,
parents all use the same URL, unlike the current separate links). Email + password fields,
Google button, "forgot password" link. Working auth against the new backend, with a demo
account so you can walk the app immediately.

**Dashboard** — the landing screen after sign-in:
- KPI cards: students, staff, today's attendance, fee collected this month, defaulters
- A collection trend chart and a class-strength breakdown
- Quick actions: new admission, collect fee, mark attendance, issue certificate
- Recent activity list
Numbers come from the database so the screen is real, not a static mockup.

**Navigation** — collapsible left sidebar with the full module tree, grouped:
- Academics: Student Lifecycle, Attendance, Examinations, Timetable, Teacher Diary
- Finance: Fee, Accounts
- Operations: Transport, Library, Hostel, Inventory & Procurement
- People: Payroll & HR
- Communication, Certificates
- Settings: School profile, Academic sessions, Users & roles

Top bar: school name and switcher, academic-session selector, global search,
notifications, user menu with sign out. Sidebar collapses to icons on desktop and becomes
a drawer on mobile. Every module link opens a consistent page inside the shell showing the
module's title and its planned screens, so the whole app is walkable.

## Design direction

A dense, confident administrative interface — deliberately not generic SaaS. Deep
indigo/slate primary with a warm amber accent, data-first spacing, tabular numerals for
figures, clear section rules. All colours as semantic tokens so per-school branding can be
layered on later.

## Minimum backend for the prototype

Multi-tenant from the start: one shared database with `school_id` on every tenant-scoped
table and row-level security, rather than the current one-database-per-school design.

- `schools` — name, code, logo, city, board, status
- `academic_sessions` — school, label, start/end, current flag
- `profiles` — full name, phone, avatar per user
- `app_role` enum and `user_school_roles` (user × school × role; roles in their own table,
  never on the profile)
- `has_role()` / `is_member_of_school()` security-definer helpers used by every policy
- `modules` catalogue driving the sidebar and role visibility
- Seed: one demo school, current session, module catalogue, and enough sample figures for
  the dashboard to look real

Email/password and Google sign-in both enabled. Protected pages sit behind an auth gate;
the login page stays public.

## Noted for the build phase — not in the prototype

Recorded now so the design doesn't paint us into a corner:

1. **Self-serve onboarding.** New schools must be able to start without your technical
   team. Public signup → you approve and set trial duration and limits per request →
   owner runs a setup wizard → owner imports their own students, staff, fees, transport,
   inventory and teacher work allocation via in-app Excel/CSV upload with column mapping
   and error preview. This replaces emailing formats to clients. Trial (7/15 days,
   configurable at approval) then converts to a paid agreement.
2. **Self-service credentials.** No more admin-created users with admin-only password
   resets. Email + Google sign-in with real forgot-password, plus a hybrid path where an
   admin bulk-creates or imports accounts and each person sets their own password from an
   invite link.
3. **One login per school** for every role — already reflected in the prototype's login.
4. **Deployment target.** Existing infrastructure is two Windows servers, one for the
   application and one for SQL Server. This rewrite runs as a web app with a managed
   Postgres backend, so it does not deploy to those servers as-is. When we get to
   go-live we'll decide between hosting the new stack alongside them, self-hosting on the
   application server, or a full cloud move — and the SQL Server box stays the source for
   data migration either way.

## Phases after the prototype

1. Self-serve signup, approval, trial and the onboarding wizard + import engine
2. Student Lifecycle — enquiry, registration, admission, student records
3. Fee — structures, demands, collection, receipts, defaulters
4. Examinations, Timetable, Transport, Payroll, and the rest
