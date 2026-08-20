import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ArrowUpRight, ArrowDownRight, Minus, Info, FileText, SlidersHorizontal } from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip as UiTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getDashboard } from "@/lib/erp.functions";
import { MODULE_BY_KEY, AREA_LABELS, type ModuleArea } from "@/lib/module-catalogue";
import {
  dashboardSpecFor, STATUS_LABEL, type DashData, type TileSpec, type WidgetStatus, type WorklistSpec,
} from "@/lib/dashboard-spec";
import { iconFor } from "./icon-map";
import { useWorkspace } from "./workspace";
import { WidgetEditor } from "./widget-editor";
import { applyOverrides, fetchWidgetOverrides, type OverrideMap } from "@/lib/widget-overrides";

const EDITOR_ROLES = ["super_admin", "school_owner", "school_admin", "principal"];

/* ------------------------------------------------------------------ atoms */

function StatusChip({ status, className }: { status: WidgetStatus; className?: string }) {
  if (status === "ready") return null;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]",
        status === "blocked" && "bg-muted text-muted-foreground",
        status === "decision" && "bg-warning/15 text-warning-foreground",
        className,
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function NoteHint({ note }: { note: string }) {
  return (
    <TooltipProvider delayDuration={150}>
      <UiTooltip>
      <TooltipTrigger asChild>
        <button type="button" aria-label="Why" className="text-muted-foreground/70 transition hover:text-foreground">
          <Info className="size-3.5" />
        </button>
      </TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs leading-relaxed">{note}</TooltipContent>
      </UiTooltip>
    </TooltipProvider>
  );
}

function Panel({
  title, subtitle, status, note, children, className,
}: {
  title: string;
  subtitle?: string;
  status?: WidgetStatus;
  note?: string | undefined;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("min-w-0 overflow-hidden rounded-2xl border bg-card", className)}>
      <header className="flex items-start justify-between gap-3 border-b px-6 py-4">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 font-display text-base font-semibold">
            {title}
            {note ? <NoteHint note={note} /> : null}
          </h2>
          {subtitle ? <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
        {status ? <StatusChip status={status} /> : null}
      </header>
      {children}
    </section>
  );
}

/* ------------------------------------------------------------- band A tile */

function KpiTile({ tile, data, onOpen }: { tile: TileSpec; data: DashData | undefined; onOpen: (t: TileSpec) => void }) {
  const v = tile.compute && data ? tile.compute(data) : null;
  const unavailable = tile.status === "blocked" || !v;
  const tone = tile.tone ?? "primary";

  return (
    <button
      type="button"
      onClick={() => onOpen(tile)}
      aria-label={`${tile.label} — view details`}
      className={cn(
        "group flex w-full cursor-pointer flex-col justify-between rounded-2xl border bg-card p-5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        !unavailable && "hover:border-primary/40 hover:shadow-[0_10px_25px_-12px_color-mix(in_oklab,var(--color-primary)_45%,transparent)]",
        unavailable && "border-dashed bg-muted/25 hover:border-primary/30",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{tile.label}</p>
        <div className="flex shrink-0 items-center gap-1.5">
          {tile.note ? <NoteHint note={tile.note} /> : null}
          <StatusChip status={tile.status} />
        </div>
      </div>

      <p
        className={cn(
          "tnum mt-3 font-display text-3xl font-bold leading-none",
          unavailable && "text-muted-foreground/60",
          !unavailable && tone === "success" && "text-success",
          !unavailable && tone === "warning" && "text-warning-foreground",
        )}
      >
        {unavailable ? "—" : v.value}
      </p>

      {!unavailable && v.delta ? (
        <p
          className={cn(
            "mt-2 inline-flex items-center gap-1 text-xs font-medium",
            v.delta.direction === "up" && "text-success",
            v.delta.direction === "down" && "text-destructive",
            v.delta.direction === "flat" && "text-muted-foreground",
          )}
        >
          {v.delta.direction === "up" ? <ArrowUpRight className="size-3.5" />
            : v.delta.direction === "down" ? <ArrowDownRight className="size-3.5" />
              : <Minus className="size-3.5" />}
          {v.delta.value}
          <span className="font-normal text-muted-foreground">{v.delta.label}</span>
        </p>
      ) : null}

      <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
        {unavailable ? (tile.status === "blocked" ? "Not captured yet" : tile.answers) : (v.coverage ?? tile.answers)}
      </p>

      {tile.reconcile ? (
        <p className="mt-2 truncate text-[10px] uppercase tracking-[0.1em] text-muted-foreground/70">
          Reconciles to {tile.reconcile}
        </p>
      ) : null}

      <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-primary opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
        View details <ArrowRight className="size-3" />
      </span>
    </button>
  );
}

/* ---------------------------------------------------------- band C worklist */

function Worklist({ list, data }: { list: WorklistSpec; data: DashData | undefined }) {
  const rows = list.compute && data ? list.compute(data) : [];

  return (
    <Panel title={list.label} status={list.status} note={list.note}>
      {rows.length ? (
        <ul className="divide-y">
          {rows.map((r) => (
            <li key={r.title} className="flex items-center justify-between gap-3 px-6 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{r.title}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{r.meta}</p>
              </div>
              {r.value ? (
                <span
                  className={cn(
                    "tnum shrink-0 rounded-lg px-2.5 py-1 text-sm font-semibold",
                    r.tone === "danger" && "bg-destructive/10 text-destructive",
                    r.tone === "warning" && "bg-warning/15 text-warning-foreground",
                    (!r.tone || r.tone === "muted") && "bg-muted text-muted-foreground",
                  )}
                >
                  {r.value}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-6 py-8 text-center text-sm text-muted-foreground">
          {list.status === "ready" ? "Nothing needs attention right now." : list.note ?? "Not available yet."}
        </p>
      )}
    </Panel>
  );
}

/* ------------------------------------------------------------------- page */

export function ModuleDashboard({ moduleKey }: { moduleKey: string }) {
  const { school, roles } = useWorkspace();
  const [editorOpen, setEditorOpen] = useState(false);
  const mod = MODULE_BY_KEY[moduleKey];
  const Icon = iconFor(mod?.icon ?? "");
  const baseSpec = dashboardSpecFor(moduleKey);
  const canEdit = roles.some((r) => EDITOR_ROLES.includes(r));

  const { data, isPending } = useQuery({
    queryKey: ["dashboard", school?.id],
    queryFn: () => getDashboard({ data: { schoolId: school!.id } }),
    enabled: Boolean(school?.id),
  });

  const { data: overrides } = useQuery({
    queryKey: ["widget-overrides", school?.id, moduleKey],
    queryFn: () => fetchWidgetOverrides(school!.id, moduleKey),
    enabled: Boolean(school?.id),
  });

  const spec = applyOverrides(baseSpec, (overrides ?? {}) as OverrideMap);

  if (!mod) return <p className="text-sm text-muted-foreground">Unknown module.</p>;

  const dash = data as DashData | undefined;

  const tiles: TileSpec[] = spec.tiles.length
    ? spec.tiles
    : (["transaction", "setup", "report"] as ModuleArea[]).map((area) => ({
        id: area,
        label: AREA_LABELS[area],
        answers: "Screens available in this module",
        status: "ready" as const,
        compute: () => ({ value: String(mod.pages.filter((p) => p.area === area).length), coverage: "Screens available" }),
      }));

  const primaryAction = mod.pages.find((p) => p.area === "transaction") ?? mod.pages[0];
  const reports = mod.pages.filter((p) => p.area === "report");

  const feeChart = (dash?.fees ?? []).map((f) => ({
    label: new Date(f.month_start).toLocaleDateString("en-IN", { month: "short" }),
    collected: Number(f.collected_amount),
    demand: Number(f.demand_amount),
  }));
  const classChart = (dash?.classes ?? []).map((c) => ({
    label: `${c.name}${c.section ? `-${c.section}` : ""}`,
    strength: c.strength ?? 0,
  }));
  const attChart = [...(dash?.attendance ?? [])].reverse().map((a) => ({
    label: new Date(a.attendance_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
    present: a.present_count ?? 0,
    absent: a.absent_count ?? 0,
  }));

  return (
    <div className="min-h-full space-y-8">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-5" />
          </div>
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {mod.navGroup} · Module dashboard
            </p>
            <h1 className="font-display text-3xl font-bold tracking-tight">{mod.name}</h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              {spec.serves}
              {school ? ` · ${school.name}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && school ? (
            <button
              type="button"
              onClick={() => setEditorOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-lg border bg-card px-4 text-sm font-medium transition hover:border-primary/40 hover:bg-primary/5"
            >
              <SlidersHorizontal className="size-4" />
              Edit widgets
            </button>
          ) : null}
          {primaryAction ? (
          <Link
            to="/m/$module/$page"
            params={{ module: mod.key, page: primaryAction.pageKey }}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
          >
            {primaryAction.label}
            <ArrowRight className="size-4" />
          </Link>
          ) : null}
        </div>
      </div>

      {canEdit && school ? (
        <WidgetEditor
          open={editorOpen}
          onOpenChange={setEditorOpen}
          moduleKey={moduleKey}
          moduleName={mod.name}
          schoolId={school.id}
          spec={baseSpec}
          overrides={(overrides ?? {}) as OverrideMap}
        />
      ) : null}

      {/* Band A — KPI tiles */}
      {isPending && school ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-40 w-full rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {tiles.map((t) => <KpiTile key={t.id} tile={t} data={dash} />)}
        </div>
      )}

      {/* Band B — trend chart + activity */}
      <div className="grid items-start gap-5 lg:grid-cols-12">
        <Panel
          title={spec.chart.title}
          subtitle={spec.chart.subtitle}
          note={spec.chart.note}
          className="lg:col-span-8"
        >
          <div className="h-72 p-4">
            {isPending ? (
              <Skeleton className="size-full rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {spec.chart.kind === "attendance" ? (
                  <AreaChart data={attChart} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
                    <YAxis tickLine={false} axisLine={false} fontSize={11} width={38} />
                    <Tooltip cursor={{ fill: "var(--color-muted)" }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="present" stroke="var(--color-success)" fill="var(--color-success)" fillOpacity={0.15} />
                    <Area type="monotone" dataKey="absent" stroke="var(--color-warning)" fill="var(--color-warning)" fillOpacity={0.15} />
                  </AreaChart>
                ) : spec.chart.kind === "fee" ? (
                  <BarChart data={feeChart} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
                    <YAxis tickLine={false} axisLine={false} fontSize={11} width={52} />
                    <Tooltip cursor={{ fill: "var(--color-muted)" }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="demand" fill="var(--color-muted)" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="collected" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                ) : (
                  <BarChart data={classChart} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
                    <YAxis tickLine={false} axisLine={false} fontSize={11} width={44} />
                    <Tooltip cursor={{ fill: "var(--color-muted)" }} />
                    <Bar dataKey="strength" radius={[6, 6, 0, 0]}>
                      {classChart.map((_, i) => (
                        <Cell key={i} fill={i % 2 ? "var(--color-accent)" : "var(--color-primary)"} />
                      ))}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            )}
          </div>
        </Panel>

        <Panel title="Recent activity" subtitle="Latest changes across the school" className="lg:col-span-4">
          <ul className="divide-y">
            {(dash?.activity ?? []).slice(0, 6).map((a) => (
              <li key={a.id} className="px-6 py-3">
                <p className="truncate text-sm font-medium">{a.action}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{a.actor_name} · {a.entity}</p>
              </li>
            ))}
            {!isPending && (dash?.activity?.length ?? 0) === 0 ? (
              <li className="px-6 py-8 text-center text-sm text-muted-foreground">No activity yet.</li>
            ) : null}
          </ul>
        </Panel>
      </div>

      {/* Band C — exception worklists */}
      {spec.worklists.length ? (
        <div>
          <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Needs attention today
          </h2>
          <div className="grid items-start gap-5 lg:grid-cols-3">
            {spec.worklists.map((w) => <Worklist key={w.id} list={w} data={dash} />)}
          </div>
        </div>
      ) : null}

      {/* Band D — report launcher */}
      {reports.length ? (
        <div>
          <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Quick reports
          </h2>
          <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {reports.slice(0, 12).map((p) => (
              <Link
                key={p.pageKey}
                to="/m/$module/$page"
                params={{ module: mod.key, page: p.pageKey }}
                className="group flex items-center gap-3 rounded-xl border bg-card px-4 py-3 transition hover:border-primary/40 hover:bg-primary/5"
              >
                <FileText className="size-4 shrink-0 text-muted-foreground group-hover:text-primary" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{p.label}</span>
                <ArrowRight className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
              </Link>
            ))}
          </div>
          {reports.length > 12 ? (
            <p className="mt-3 text-xs text-muted-foreground">
              {reports.length - 12} more reports in the sidebar.
            </p>
          ) : null}
        </div>
      ) : null}

      {/* decisions */}
      {spec.decisions?.length ? (
        <Panel title="Open decisions" subtitle="Settle these before the blocked widgets are built">
          <ul className="divide-y">
            {spec.decisions.map((d) => (
              <li key={d.question} className="px-6 py-4">
                <p className="text-sm font-medium">{d.question}</p>
                <p className="mt-1 text-xs text-muted-foreground">Recommendation — {d.recommendation}</p>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
    </div>
  );
}
