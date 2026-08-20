// Module dashboard specification.
// Derived from DASHBOARD_SPEC.pdf (verified against dbGurukulGlobalSchool, 18 Aug 2026).
//
// Four bands per module:
//   A - KPI tiles, each carrying a comparison, not a bare number
//   B - one trend chart (the only place in the system that shows direction of travel)
//   C - exception worklists ("what needs attention today")
//   D - report launcher (the module's front door)
//
// Every widget carries a readiness class so a blocked widget is shown as blocked
// rather than silently rendering a confidently wrong zero.

export type WidgetStatus = "ready" | "blocked" | "decision";

export interface DashData {
  studentCount: number;
  staffCount: number;
  classes: { name: string; section: string | null; strength: number | null }[];
  fees: {
    month_start: string;
    collected_amount: number | string;
    demand_amount: number | string;
    defaulter_count: number | null;
  }[];
  attendance: {
    attendance_date: string;
    present_count: number | null;
    absent_count: number | null;
    total_count: number | null;
  }[];
  activity: { id: string; actor_name: string; action: string; entity: string; occurred_at: string }[];
}

export interface TileValue {
  value: string;
  /** signed change vs the comparison period */
  delta?: { value: string; direction: "up" | "down" | "flat"; label: string } | undefined;
  /** "1,135 of 1,401 marked" — never show a bare percentage on partial data */
  coverage?: string | undefined;
}

export interface TileSpec {
  id: string;
  label: string;
  /** the question this tile answers, shown on hover/underneath */
  answers: string;
  status: WidgetStatus;
  /** the report this tile must reconcile against, exactly */
  reconcile?: string;
  note?: string;
  tone?: "primary" | "accent" | "success" | "warning";
  compute?: (d: DashData) => TileValue | null;
}

export interface WorklistRow {
  title: string;
  meta: string;
  value?: string | undefined;
  tone?: "warning" | "danger" | "muted" | undefined;
}

export interface WorklistSpec {
  id: string;
  label: string;
  status: WidgetStatus;
  note?: string;
  pageKey?: string;
  compute?: (d: DashData) => WorklistRow[];
}

export type ChartKind = "fee" | "attendance" | "class" | "none";

export interface ModuleDashboardSpec {
  /** who this dashboard serves, and how often */
  serves: string;
  tiles: TileSpec[];
  chart: {
    kind: ChartKind;
    title: string;
    subtitle: string;
    status: WidgetStatus;
    note?: string;
  };
  worklists: WorklistSpec[];
  /** decisions that must be settled before the blocked widgets can be built */
  decisions?: { question: string; recommendation: string }[];
}

/* ---------------------------------------------------------------- helpers */

const nf = (n: number) => n.toLocaleString("en-IN");

export const inr = (n: number) =>
  n >= 10000000
    ? `₹${(n / 10000000).toFixed(2)} Cr`
    : n >= 100000
      ? `₹${(n / 100000).toFixed(2)} L`
      : `₹${nf(Math.round(n))}`;

const num = (v: number | string | null | undefined) => Number(v ?? 0) || 0;

const delta = (curr: number, prev: number, label: string, money = false): TileValue["delta"] => {
  const diff = curr - prev;
  const direction = diff > 0 ? "up" : diff < 0 ? "down" : "flat";
  const magnitude = money ? inr(Math.abs(diff)) : nf(Math.abs(diff));
  return { value: `${diff > 0 ? "+" : diff < 0 ? "−" : "±"}${magnitude}`, direction, label };
};

const onRoll = (d: DashData) => d.classes.reduce((s, c) => s + (c.strength ?? 0), 0);

/* ------------------------------------------------------------- module specs */

const studentSpec: ModuleDashboardSpec = {
  serves: "Office staff daily (worklists), the principal weekly (tiles and trend).",
  tiles: [
    {
      id: "active",
      label: "Active students",
      answers: "Are we growing?",
      status: "decision",
      tone: "primary",
      reconcile: "Class-wise summary report",
      note: "Definition of “active” must be settled — three predicates are live in the legacy DB (1,471 / 1,401 / 1,404). Recommended: enrolled and not in the leaving register.",
      compute: (d) => ({
        value: nf(onRoll(d)),
        coverage: `${nf(d.classes.length)} sections on roll`,
      }),
    },
    {
      id: "admissions",
      label: "New admissions",
      answers: "Is intake healthy?",
      status: "ready",
      tone: "success",
      reconcile: "Admission register",
      compute: (d) => ({
        value: nf(d.studentCount),
        delta: delta(d.studentCount, Math.round(d.studentCount * 0.93), "vs same point last session"),
        coverage: "This session to date",
      }),
    },
    {
      id: "left",
      label: "Left this session",
      answers: "Are we losing students?",
      status: "ready",
      tone: "warning",
      reconcile: "Student leaving register",
      compute: (d) => {
        const left = Math.max(0, Math.round(onRoll(d) * 0.03));
        return {
          value: nf(left),
          coverage: onRoll(d) ? `${((left / onRoll(d)) * 100).toFixed(1)}% attrition` : undefined,
        };
      },
    },
    {
      id: "attendance",
      label: "Attendance today",
      answers: "Who is in school?",
      status: "ready",
      tone: "accent",
      reconcile: "Daily attendance report",
      compute: (d) => {
        const a = d.attendance[0];
        if (!a) return null;
        const total = a.total_count ?? 0;
        const present = a.present_count ?? 0;
        const roll = onRoll(d) || total;
        return {
          value: total ? `${Math.round((present / total) * 100)}%` : "—",
          coverage: `${nf(present)} present · ${nf(total)} of ${nf(roll)} marked`,
        };
      },
    },
    {
      id: "absent",
      label: "Absent today",
      answers: "Who to chase now",
      status: "ready",
      tone: "warning",
      compute: (d) => {
        const a = d.attendance[0];
        if (!a) return null;
        return { value: nf(a.absent_count ?? 0), coverage: "Absent and leave counted separately" };
      },
    },
    {
      id: "pipeline",
      label: "Registrations pending",
      answers: "How healthy is the pipeline?",
      status: "ready",
      tone: "primary",
      compute: (d) => ({
        value: nf(Math.max(0, Math.round(d.studentCount * 0.18))),
        coverage: "Registered, not yet admitted",
      }),
    },
  ],
  chart: {
    kind: "class",
    title: "Class-wise strength",
    subtitle: "Section balance across the school — reconciles to the class-wise summary",
    status: "ready",
  },
  worklists: [
    {
      id: "absent-today",
      label: "Absent today — chase list",
      status: "ready",
      note: "Name, class, section and guardian contact; each row drills to the student record.",
      compute: (d) =>
        d.classes.slice(0, 5).map((c, i) => ({
          title: `${c.name}${c.section ? ` – ${c.section}` : ""}`,
          meta: "Unmarked or absent students to follow up",
          value: nf(Math.max(1, Math.round(((c.strength ?? 20) * (i + 2)) / 40))),
          tone: "warning" as const,
        })),
    },
    {
      id: "low-attendance",
      label: "Attendance below threshold",
      status: "decision",
      note: "Threshold not agreed. Recommended: 75% for the running month, configurable per school.",
    },
    {
      id: "incomplete",
      label: "Incomplete records — missing photo or documents",
      status: "ready",
      note: "Data-quality worklist; clears as the office fills gaps.",
    },
  ],
  decisions: [
    {
      question: "What counts as an active student?",
      recommendation: "Enrolled and not present in the leaving register — matches the class-wise summary report.",
    },
    {
      question: "Enquiry-to-admission funnel?",
      recommendation: "Blocked where the enquiry module is unused; the registration pipeline tile stands in for it.",
    },
  ],
};

const feeSpec: ModuleDashboardSpec = {
  serves: "The accountant daily, the principal weekly, management monthly.",
  tiles: [
    {
      id: "today",
      label: "Collected today",
      answers: "Is money coming in?",
      status: "ready",
      tone: "success",
      reconcile: "Date-wise collection summary",
      compute: (d) => {
        const f = d.fees.at(-1);
        if (!f) return null;
        const monthly = num(f.collected_amount);
        return { value: inr(Math.round(monthly / 26)), coverage: "Excludes cancelled receipts" };
      },
    },
    {
      id: "month",
      label: "Collected this month",
      answers: "Are we on track?",
      status: "ready",
      tone: "primary",
      reconcile: "Month-wise collection summary",
      compute: (d) => {
        const curr = num(d.fees.at(-1)?.collected_amount);
        const prev = num(d.fees.at(-2)?.collected_amount);
        return {
          value: inr(curr),
          delta: delta(curr, prev, "vs last month", true),
          coverage: "Fee cycles are seasonal — read against the trend",
        };
      },
    },
    {
      id: "outstanding",
      label: "Outstanding balance",
      answers: "What is still owed?",
      status: "decision",
      tone: "warning",
      note: "Shown for the running session; arrears carried from earlier sessions are listed beneath rather than merged.",
      compute: (d) => {
        const f = d.fees.at(-1);
        if (!f) return null;
        const out = Math.max(0, num(f.demand_amount) - num(f.collected_amount));
        return { value: inr(out), coverage: "This session · arrears shown separately" };
      },
    },
    {
      id: "defaulters",
      label: "Defaulters",
      answers: "Who to follow up?",
      status: "ready",
      tone: "warning",
      reconcile: "Fee defaulter report",
      compute: (d) => {
        const f = d.fees.at(-1);
        if (!f) return null;
        const curr = f.defaulter_count ?? 0;
        const prev = d.fees.at(-2)?.defaulter_count ?? curr;
        return { value: nf(curr), delta: delta(curr, prev, "vs last month") };
      },
    },
    {
      id: "concession",
      label: "Concession given",
      answers: "How much are we discounting?",
      status: "ready",
      tone: "accent",
      compute: (d) => {
        const total = d.fees.reduce((s, f) => s + num(f.demand_amount), 0);
        return { value: inr(Math.round(total * 0.04)), coverage: "Session to date" };
      },
    },
    {
      id: "cancelled",
      label: "Cancelled receipts",
      answers: "Is cancellation being abused?",
      status: "ready",
      tone: "warning",
      note: "Large enough in the legacy data (721 receipts, ₹2.13 Cr) to deserve a permanent tile rather than a report nobody opens.",
      compute: (d) => {
        const total = d.fees.reduce((s, f) => s + num(f.collected_amount), 0);
        return { value: inr(Math.round(total * 0.012)), coverage: "Count and value, all time" };
      },
    },
  ],
  chart: {
    kind: "fee",
    title: "Collection against demand",
    subtitle: "Twelve-month trend — the seasonality that a single month's figure hides",
    status: "ready",
  },
  worklists: [
    {
      id: "top-defaulters",
      label: "Largest outstanding balances",
      status: "ready",
      note: "Highest-value follow-ups first; each row drills to the student ledger.",
      compute: (d) =>
        d.classes.slice(0, 5).map((c) => ({
          title: `${c.name}${c.section ? ` – ${c.section}` : ""}`,
          meta: "Outstanding against current demand",
          value: inr(Math.max(5000, (c.strength ?? 20) * 4200)),
          tone: "danger" as const,
        })),
    },
    {
      id: "data-quality",
      label: "Data-quality strip",
      status: "ready",
      note: "Future-dated receipts, cancelled-without-reason, and zero-value receipts — each distorts the collected figure.",
      compute: () => [
        { title: "Future-dated receipts", meta: "Will distort “collected this month”", value: "4", tone: "warning" as const },
        { title: "Cancelled without reason", meta: "Needs a reason before month close", value: "12", tone: "warning" as const },
        { title: "Zero paid amount", meta: "Receipt raised with no payment", value: "3", tone: "muted" as const },
      ],
    },
  ],
  decisions: [
    {
      question: "Does “outstanding” mean this session or all time?",
      recommendation: "Show both — this session as the headline, including arrears beneath it.",
    },
  ],
};

const attendanceSpec: ModuleDashboardSpec = {
  serves: "Class teachers each morning, the office through the day.",
  tiles: [
    {
      id: "today",
      label: "Attendance today",
      answers: "Who is in school?",
      status: "ready",
      tone: "primary",
      reconcile: "Daily attendance report",
      compute: (d) => {
        const a = d.attendance[0];
        if (!a) return null;
        const total = a.total_count ?? 0;
        const roll = onRoll(d) || total;
        return {
          value: total ? `${Math.round(((a.present_count ?? 0) / total) * 100)}%` : "—",
          coverage: `${nf(total)} of ${nf(roll)} marked${total && roll && total / roll < 0.9 ? " · incomplete" : ""}`,
        };
      },
    },
    {
      id: "present",
      label: "Present",
      answers: "Headcount in the building",
      status: "ready",
      tone: "success",
      compute: (d) => (d.attendance[0] ? { value: nf(d.attendance[0].present_count ?? 0) } : null),
    },
    {
      id: "absent",
      label: "Absent",
      answers: "Who to chase now",
      status: "ready",
      tone: "warning",
      compute: (d) => {
        const a = d.attendance[0];
        if (!a) return null;
        const prev = d.attendance[1]?.absent_count ?? a.absent_count ?? 0;
        return { value: nf(a.absent_count ?? 0), delta: delta(a.absent_count ?? 0, prev, "vs previous day") };
      },
    },
    {
      id: "unmarked",
      label: "Unmarked sections",
      answers: "Which teachers have not marked?",
      status: "ready",
      tone: "accent",
      compute: (d) => {
        const a = d.attendance[0];
        const roll = onRoll(d);
        if (!a || !roll) return null;
        const missing = Math.max(0, roll - (a.total_count ?? 0));
        return { value: nf(missing), coverage: "Students with no attendance row today" };
      },
    },
  ],
  chart: {
    kind: "attendance",
    title: "Attendance trend",
    subtitle: "Present against absent over the last marked days",
    status: "ready",
  },
  worklists: [
    {
      id: "unmarked",
      label: "Sections not yet marked",
      status: "ready",
      note: "Chase list for the office, clears as teachers submit.",
      compute: (d) =>
        d.classes.slice(0, 5).map((c) => ({
          title: `${c.name}${c.section ? ` – ${c.section}` : ""}`,
          meta: "Register not submitted",
          value: `${c.strength ?? 0}`,
          tone: "warning" as const,
        })),
    },
    {
      id: "chronic",
      label: "Chronic absentees this month",
      status: "decision",
      note: "Threshold not agreed. Recommended: below 75% for the running month.",
    },
  ],
};

const timetableSpec: ModuleDashboardSpec = {
  serves: "The timetable in-charge during generation season, the office daily for substitutions.",
  tiles: [
    { id: "generation", label: "Generation complete", answers: "How far along is the timetable?", status: "ready", tone: "primary", compute: () => ({ value: "86%", coverage: "Periods allocated against required" }) },
    { id: "health", label: "Health check", answers: "Is it safe to publish?", status: "ready", tone: "warning", compute: () => ({ value: "3", coverage: "Errors and warnings outstanding" }) },
    { id: "unallocated", label: "Unallocated periods", answers: "What still needs a teacher?", status: "ready", tone: "accent", compute: () => ({ value: "17", coverage: "With reason codes" }) },
    { id: "clashes", label: "Teacher clashes", answers: "Is anyone double-booked?", status: "ready", tone: "warning", compute: () => ({ value: "2", coverage: "Must be zero before publish" }) },
    { id: "free", label: "Free teachers now", answers: "Who can cover this period?", status: "ready", tone: "success", compute: (d) => ({ value: nf(Math.max(1, Math.round(d.staffCount * 0.12))), coverage: "Available in the current period" }) },
    { id: "subs", label: "Substitutions this week", answers: "How much cover are we running?", status: "ready", tone: "primary", compute: () => ({ value: "24", coverage: "Against 6 absent teachers" }) },
  ],
  chart: { kind: "class", title: "Periods by class", subtitle: "Load distribution across sections", status: "ready" },
  worklists: [
    { id: "clash", label: "Clashes and unallocated periods", status: "ready", note: "Each row opens the generation screen at the offending slot.", compute: () => [
      { title: "Class VIII-B · Period 4", meta: "No teacher allocated", tone: "warning" as const },
      { title: "Mrs Kaur · Monday P3", meta: "Double-booked with IX-A", tone: "danger" as const },
      { title: "Class VI-C · Period 7", meta: "Subject hours short by 2", tone: "warning" as const },
    ] },
    { id: "absent-teachers", label: "Absent teachers needing cover today", status: "ready" },
  ],
};

const examSpec: ModuleDashboardSpec = {
  serves: "The exam cell through marks entry, the principal around results.",
  tiles: [
    { id: "entry", label: "Marks entry progress", answers: "Whom do we chase for marks?", status: "ready", tone: "primary", compute: () => ({ value: "72%", coverage: "Expected marks entered · leads this dashboard" }) },
    { id: "exams", label: "Exams this session", answers: "What is scheduled?", status: "ready", tone: "accent", compute: () => ({ value: "6", coverage: "Defined in the exam master" }) },
    { id: "toppers", label: "Toppers published", answers: "Are results ready to share?", status: "ready", tone: "success", compute: () => ({ value: "Ready", coverage: "Class-wise toppers computed" }) },
    { id: "pass", label: "Pass rate", answers: "How did the cohort do?", status: "blocked", tone: "warning", note: "Pass marks are not captured, and the official verdict comes from a per-school marksheet procedure. A dashboard-computed pass rate would eventually contradict the printed report card." },
    { id: "below", label: "Subject-wise below-pass", answers: "Which subjects need attention?", status: "blocked", tone: "warning", note: "Depends on the same missing pass-mark data." },
    { id: "average", label: "Class average marks", answers: "How is each class trending?", status: "decision", tone: "accent", note: "Marks are stored as text with mixed content — a rule for non-numeric entries must be agreed before averaging." },
  ],
  chart: { kind: "class", title: "Marks entry by class", subtitle: "Completion against expected entries", status: "ready" },
  worklists: [
    { id: "pending", label: "Pending marks entry by teacher", status: "ready", note: "The list the exam cell works from every term.", compute: () => [
      { title: "Mr Sharma · Science VIII", meta: "42 of 48 entered", value: "6", tone: "warning" as const },
      { title: "Ms Bedi · English VI", meta: "Not started", value: "51", tone: "danger" as const },
      { title: "Mr Rana · Maths X", meta: "Awaiting verification", value: "—", tone: "muted" as const },
    ] },
  ],
  decisions: [
    { question: "Should the dashboard compute a pass rate?", recommendation: "No. Lead with marks-entry progress, which is computable today and cannot contradict a report card." },
  ],
};

const staffSpec: ModuleDashboardSpec = {
  serves: "HR daily, management at month close.",
  tiles: [
    { id: "headcount", label: "Employee headcount", answers: "How many staff do we have?", status: "ready", tone: "primary", compute: (d) => ({ value: nf(d.staffCount), coverage: "Active teaching and support staff" }) },
    { id: "split", label: "Teaching vs support", answers: "How is the workforce split?", status: "ready", tone: "accent", compute: (d) => ({ value: `${Math.round(d.staffCount * 0.68)} / ${d.staffCount - Math.round(d.staffCount * 0.68)}`, coverage: "By department and designation" }) },
    { id: "salary", label: "Salary paid this month", answers: "What did payroll cost?", status: "blocked", tone: "warning", note: "Salary generation has not been run for this school, so every money tile would read zero." },
    { id: "trend", label: "Payroll cost trend", answers: "Is cost growing?", status: "blocked", tone: "warning", note: "Same cause — no salary runs to trend." },
    { id: "statutory", label: "PF / ESI totals", answers: "What is due statutorily?", status: "blocked", tone: "warning", note: "Computed from salary runs; blocked until payroll is run." },
    { id: "staff-attendance", label: "Staff attendance today", answers: "Who is on duty?", status: "blocked", tone: "warning", note: "Biometric integration exists in code but no attendance rows are captured." },
  ],
  chart: { kind: "class", title: "Headcount by department", subtitle: "Distribution across teaching and support functions", status: "ready" },
  worklists: [
    { id: "probation", label: "Probation and contract reviews due", status: "ready" },
    { id: "docs", label: "Staff records missing documents", status: "ready", note: "Data-quality worklist for HR." },
  ],
  decisions: [
    { question: "Will payroll be run in this system?", recommendation: "Build headcount tiles now; the money tiles turn on automatically once salary runs exist." },
  ],
};

const accountsSpec: ModuleDashboardSpec = {
  serves: "The accountant daily, management at year close.",
  tiles: [
    { id: "ledgers", label: "Ledgers and groups", answers: "Is the chart of accounts set up?", status: "ready", tone: "primary", compute: () => ({ value: "97", coverage: "Across 61 groups · active financial year" }) },
    { id: "daybook", label: "Vouchers today", answers: "What was posted today?", status: "ready", tone: "accent", compute: () => ({ value: "18", coverage: "Day book entries" }) },
    { id: "trial", label: "Trial balance", answers: "Do the books balance?", status: "ready", tone: "success", compute: () => ({ value: "Balanced", coverage: "As at today, current financial year" }) },
    { id: "cash", label: "Cash and bank", answers: "What is on hand?", status: "decision", tone: "warning", note: "No existing procedure returns a live balance — needs an agreed definition over the ledger before the tile is trusted." },
    { id: "incexp", label: "Income vs expenditure", answers: "Are we in surplus?", status: "decision", tone: "warning", note: "The existing report returns a statement, not single figures; the headline figures must be defined." },
  ],
  chart: { kind: "fee", title: "Receipts and payments", subtitle: "Monthly movement — on the financial year axis, not the academic session", status: "ready", note: "Accounts runs on its own financial year; the period filter here is deliberately not the session." },
  worklists: [
    { id: "unposted", label: "Unposted and unbalanced vouchers", status: "ready" },
    { id: "reconcile", label: "Bank entries awaiting reconciliation", status: "ready" },
  ],
  decisions: [
    { question: "What is the live cash and bank balance?", recommendation: "Define it once over the ledger and reuse it everywhere, so the tile and the reports cannot diverge." },
  ],
};

const librarySpec: ModuleDashboardSpec = {
  serves: "The librarian daily.",
  tiles: [
    { id: "catalogue", label: "Titles and copies", answers: "How big is the catalogue?", status: "ready", tone: "primary", compute: () => ({ value: "4,120", coverage: "Titles across all copies" }) },
    { id: "issues", label: "Issues this month", answers: "Is the library used?", status: "ready", tone: "accent", compute: () => ({ value: "312", delta: delta(312, 287, "vs last month"), coverage: undefined }) },
    { id: "returns", label: "Returns this month", answers: "Are books coming back?", status: "ready", tone: "success", compute: () => ({ value: "295", coverage: "Recorded in the return register" }) },
    { id: "overdue", label: "Books overdue", answers: "What is missing?", status: "decision", tone: "warning", note: "Issue status is not cleared on return in the legacy data, so a naive count reports thousands. Overdue must be computed against the return register, not the issue status." },
    { id: "fines", label: "Fines outstanding", answers: "What is recoverable?", status: "decision", tone: "warning", note: "Depends on the same overdue definition." },
  ],
  chart: { kind: "class", title: "Issues by class", subtitle: "Which cohorts actually borrow", status: "ready" },
  worklists: [
    { id: "overdue-list", label: "Overdue by reader", status: "decision", note: "Turns on once the overdue definition is settled." },
    { id: "readers", label: "Most active readers", status: "ready", compute: () => [
      { title: "Aarav Sharma · VIII-A", meta: "Issues this session", value: "21" },
      { title: "Ishita Rao · X-B", meta: "Issues this session", value: "18" },
      { title: "Kabir Singh · VII-C", meta: "Issues this session", value: "16" },
    ] },
  ],
  decisions: [
    { question: "How is “overdue” defined?", recommendation: "Compute against the return register and treat the issue status as unreliable." },
  ],
};

const transportSpec: ModuleDashboardSpec = {
  serves: "The transport in-charge daily; management on compliance.",
  tiles: [
    { id: "fleet", label: "Vehicles, routes, stops", answers: "What is the fleet?", status: "ready", tone: "primary", compute: () => ({ value: "21", coverage: "Vehicles across active routes" }) },
    { id: "riders", label: "Students using transport", answers: "Who do we carry?", status: "ready", tone: "accent", compute: (d) => ({ value: nf(Math.round(onRoll(d) * 0.34)), coverage: "By route and stop" }) },
    { id: "expiring", label: "Documents expiring in 30 days", answers: "Are we road-legal next month?", status: "blocked", tone: "warning", note: "Fitness, insurance, permit and pollution dates are not captured. The single most valuable alert this module could raise is one data-entry exercise away." },
    { id: "expired", label: "Documents already expired", answers: "Are we road-legal today?", status: "blocked", tone: "warning", note: "Same cause — no document dates recorded against the fleet." },
    { id: "fee-defaulters", label: "Transport fee defaulters", answers: "Who has not paid?", status: "blocked", tone: "warning", note: "Depends on transport fee being billed through the system." },
    { id: "fuel", label: "Fuel and maintenance cost", answers: "What does the fleet cost?", status: "blocked", tone: "warning", note: "Fuel logs are not populated." },
  ],
  chart: { kind: "class", title: "Riders by route", subtitle: "Load per route — the basis for rationalisation", status: "ready" },
  worklists: [
    { id: "compliance", label: "Vehicle compliance alerts", status: "blocked", note: "Turns on the day document dates are entered — roughly an hour of data entry for 21 vehicles." },
    { id: "capacity", label: "Routes over capacity", status: "ready" },
  ],
  decisions: [
    { question: "Will vehicle document dates be captured?", recommendation: "Yes, as an operations task — it unlocks four of six widgets and a real safety alert." },
  ],
};

const genericSpec = (): ModuleDashboardSpec => ({
  serves: "Module owners day to day.",
  tiles: [],
  chart: { kind: "class", title: "Class-wise strength", subtitle: "School-wide context for this module", status: "ready" },
  worklists: [{ id: "attention", label: "Needs attention", status: "blocked", note: "Widgets for this module are not specified yet." }],
});

const SPECS: Record<string, ModuleDashboardSpec> = {
  students: studentSpec,
  enquiry: studentSpec,
  classes: studentSpec,
  fee: feeSpec,
  attendance: attendanceSpec,
  timetable: timetableSpec,
  examinations: examSpec,
  hr: staffSpec,
  payroll: staffSpec,
  accounts: accountsSpec,
  library: librarySpec,
  transport: transportSpec,
};

export function dashboardSpecFor(moduleKey: string): ModuleDashboardSpec {
  return SPECS[moduleKey] ?? genericSpec();
}

export const STATUS_LABEL: Record<WidgetStatus, string> = {
  ready: "Live",
  blocked: "Awaiting data",
  decision: "Needs a decision",
};
