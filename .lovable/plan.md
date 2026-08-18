# Navigation rebuild: module-first sidebar + two levels of dashboard

Your existing ERP menu is organised **area-first** — Master, Transaction, Report, Tools — with the same
domain (Fee, Examinations, Transport…) repeated inside each area, and the page URL built by
concatenating the three names. That is why "Examinations" and "Examination" both have to exist, and why
the student domain carries three different names.

The rewrite keeps every one of those pages, but flips the tree to be **module-first**, and adds the two
dashboard levels you asked for.

## The two dashboards

**Common dashboard** (`/dashboard`) — the landing page after sign-in. Stays as it is today: school-wide
KPIs, fee collection chart, class strength, activity feed, quick actions. This is the cross-module view.

**Module dashboard** (e.g. `/fee`, `/examinations`, `/transport`) — clicking a module in the sidebar no
longer opens a placeholder. It opens that module's own dashboard: module-specific KPI cards, a chart or
two relevant to that domain, and then the module's full page catalogue grouped into **Setup**,
**Daily work** and **Reports** (the old Master / Transaction / Report areas, now shown inside the module
rather than above it). Each page is listed with its label so the whole 426-page tree is visible and
walkable; pages not yet built open a "planned" state.

## The sidebar

Grouped by domain, matching your existing module list rather than inventing new names:

```text
Dashboard                       <- common dashboard

ACADEMICS
  Enquiry            Student Management     Class Management
  Examinations       Timetable              Attendance
  Teacher Diary      Competition            Medical

FINANCE
  Fee                Accounts               Payroll

OPERATIONS
  Transport          Library                Hostel
  Inventory          Event Management

PEOPLE
  HR                 Interview Candidates

COMMUNICATION
  SMS / Notices      Certificates

TOOLS
  Securities (users, roles, rights)         Settings
```

Each entry expands in place to its Setup / Daily work / Reports sections, and the module dashboard shows
the same three sections as cards — so you can reach a page either way. Sidebar still collapses to icons
on desktop and becomes a drawer on mobile.

## Rights

The old system decides visibility per page via `CanView` on the user's profile. The same idea carries
over: the page catalogue lives in the database with the module and area it belongs to, and each role gets
view rights per page. For the prototype the admin role sees the whole tree, other roles see their module
subset — the per-page rights UI comes with the Securities module later.

## Technical notes

- New table `module_pages`: module key, area (`setup` / `transaction` / `report`), label, page key, sort
  order, `is_built` flag. Seeded from your menu map so the tree is real data, not hardcoded JSX.
- `modules` table extended and re-seeded to the domain list above (adds Enquiry, Class Management,
  Competition, Medical, Event Management, Interview Candidates, Securities; renames a few).
- `getWorkspace` returns modules plus their pages; sidebar and module dashboards both read from it.
- New `ModuleDashboard` component replaces `ModulePlaceholder`; one route file per module, each with its
  own `head()` metadata.
- Module KPI figures come from the existing seed tables where data exists (students, staff, fee,
  attendance) and are marked clearly as awaiting data where it does not.
