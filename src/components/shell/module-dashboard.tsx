import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getDashboard } from "@/lib/erp.functions";
import { MODULE_BY_KEY } from "@/lib/module-catalogue";
import { iconFor } from "./icon-map";
import { useWorkspace } from "./workspace";

const inr = (n: number) =>
  n >= 10000000 ? `₹${(n / 10000000).toFixed(2)} Cr`
    : n >= 100000 ? `₹${(n / 100000).toFixed(2)} L`
      : `₹${n.toLocaleString("en-IN")}`;

export function ModuleDashboard({ moduleKey }: { moduleKey: string }) {
  const { school } = useWorkspace();
  const mod = MODULE_BY_KEY[moduleKey];
  const Icon = iconFor(mod?.icon ?? "");

  const { data, isPending } = useQuery({
    queryKey: ["dashboard", school?.id],
    queryFn: () => getDashboard({ data: { schoolId: school!.id } }),
    enabled: Boolean(school?.id),
  });

  if (!mod) return <p className="text-sm text-muted-foreground">Unknown module.</p>;

  const onRoll = (data?.classes ?? []).reduce((s, c) => s + (c.strength ?? 0), 0);
  const latestFee = data?.fees.at(-1);
  const latestAtt = data?.attendance[0];

  const kpis: { label: string; value: string; hint?: string; tone: "primary" | "accent" | "success" }[] = (() => {
    switch (mod.key) {
      case "students":
      case "enquiry":
      case "classes":
        return [
          { label: "Students on roll", value: onRoll.toLocaleString("en-IN"), hint: "Across all sections", tone: "primary" },
          { label: "Class sections", value: String(data?.classes.length ?? 0), hint: "Active this session", tone: "accent" },
          { label: "Detailed records", value: String(data?.studentCount ?? 0), hint: "Full profiles captured", tone: "success" },
        ];
      case "fee":
        return [
          { label: "Collected (month)", value: latestFee ? inr(Number(latestFee.collected_amount)) : "—", hint: "Latest billing month", tone: "primary" },
          { label: "Demand raised", value: latestFee ? inr(Number(latestFee.demand_amount)) : "—", hint: "Against current demand", tone: "accent" },
          { label: "Defaulters", value: String(latestFee?.defaulter_count ?? 0), hint: "Outstanding accounts", tone: "success" },
        ];
      case "attendance":
        return [
          { label: "Present today", value: String(latestAtt?.present_count ?? "—"), hint: "Marked this morning", tone: "primary" },
          { label: "Absent today", value: String(latestAtt?.absent_count ?? "—"), hint: "Follow-up pending", tone: "accent" },
          { label: "Marked against", value: String(latestAtt?.total_count ?? "—"), hint: "Total on roll", tone: "success" },
        ];
      case "hr":
      case "payroll":
        return [
          { label: "Active staff", value: String(data?.staffCount ?? 0), hint: "Teaching and support", tone: "primary" },
          { label: "Salary runs", value: "—", hint: "Awaiting data", tone: "accent" },
          { label: "Open leave requests", value: "—", hint: "Awaiting data", tone: "success" },
        ];
      default:
        return [
          { label: "Configuration screens", value: String(mod.pages.filter((p) => p.area === "setup").length), hint: "Masters and rules", tone: "primary" },
          { label: "Daily operations", value: String(mod.pages.filter((p) => p.area === "transaction").length), hint: "Entry screens", tone: "accent" },
          { label: "Reports", value: String(mod.pages.filter((p) => p.area === "report").length), hint: "Analytical outputs", tone: "success" },
        ];
    }
  })();

  const primaryAction = mod.pages.find((p) => p.area === "transaction") ?? mod.pages[0];

  const feeChart = (data?.fees ?? []).map((f) => ({
    label: new Date(f.month_start as string).toLocaleDateString("en-IN", { month: "short" }),
    collected: Number(f.collected_amount),
    demand: Number(f.demand_amount),
  }));
  const classChart = (data?.classes ?? []).map((c) => ({
    label: `${c.name}${c.section ? `-${c.section}` : ""}`,
    strength: c.strength ?? 0,
  }));
  const attChart = [...(data?.attendance ?? [])].reverse().map((a) => ({
    label: new Date(a.attendance_date as string).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
    present: a.present_count ?? 0,
    absent: a.absent_count ?? 0,
  }));

  const isFee = mod.key === "fee" || mod.key === "accounts" || mod.key === "payroll";
  const isAtt = mod.key === "attendance";

  return (
    <div className="min-h-full space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-5" />
          </div>
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {mod.navGroup} · Module
            </p>
            <h1 className="font-display text-3xl font-bold tracking-tight">{mod.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {mod.pages.length} screens
              {school ? ` · ${school.name}` : ""}
            </p>
          </div>
        </div>
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

      {isPending && school ? (
        <div className="grid gap-5 sm:grid-cols-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-3">
          {kpis.map((k) => (
            <div
              key={k.label}
              className="group rounded-2xl border bg-card p-5 transition hover:border-primary/40 hover:shadow-[0_10px_25px_-12px_color-mix(in_oklab,var(--color-primary)_45%,transparent)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    {k.label}
                  </p>
                  <p className="tnum mt-1.5 font-display text-3xl font-bold leading-none">{k.value}</p>
                  {k.hint ? (
                    <p className="mt-2 truncate text-xs text-muted-foreground">{k.hint}</p>
                  ) : null}
                </div>
                <div
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-xl",
                    k.tone === "primary" && "bg-primary/10 text-primary",
                    k.tone === "accent" && "bg-accent/20 text-accent-foreground",
                    k.tone === "success" && "bg-success/12 text-success",
                  )}
                >
                  <Icon className="size-5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-12">
        <section className="min-w-0 overflow-hidden rounded-2xl border bg-card lg:col-span-8">
          <header className="border-b px-6 py-4">
            <h2 className="font-display text-base font-semibold">
              {isFee ? "Collection against demand" : isAtt ? "Attendance trend" : "Strength by class"}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {isFee ? "Monthly billing performance" : isAtt ? "Last five marked days" : "Live section-wise distribution"}
            </p>
          </header>
          <div className="h-72 p-4">
            {isPending ? (
              <Skeleton className="size-full rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {isAtt ? (
                  <AreaChart data={attChart} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
                    <YAxis tickLine={false} axisLine={false} fontSize={11} width={38} />
                    <Tooltip cursor={{ fill: "var(--color-muted)" }} />
                    <Area type="monotone" dataKey="present" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.15} />
                    <Area type="monotone" dataKey="absent" stroke="var(--color-accent)" fill="var(--color-accent)" fillOpacity={0.15} />
                  </AreaChart>
                ) : (
                  <BarChart data={isFee ? feeChart : classChart} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
                    <YAxis tickLine={false} axisLine={false} fontSize={11} width={44} />
                    <Tooltip cursor={{ fill: "var(--color-muted)" }} />
                    <Bar dataKey={isFee ? "collected" : "strength"} radius={[6, 6, 0, 0]}>
                      {(isFee ? feeChart : classChart).map((_, i) => (
                        <Cell key={i} fill={i % 2 ? "var(--color-accent)" : "var(--color-primary)"} />
                      ))}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="min-w-0 overflow-hidden rounded-2xl border bg-card lg:col-span-4">
          <header className="border-b px-6 py-4">
            <h2 className="font-display text-base font-semibold">Recent activity</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Latest changes across the school</p>
          </header>
          <ul className="divide-y">
            {(data?.activity ?? []).slice(0, 5).map((a) => (
              <li key={a.id} className="px-6 py-3.5">
                <p className="truncate text-sm font-medium">{a.action}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {a.actor_name} · {a.entity}
                </p>
              </li>
            ))}
            {!isPending && (data?.activity?.length ?? 0) === 0 ? (
              <li className="px-6 py-8 text-center text-sm text-muted-foreground">No activity yet.</li>
            ) : null}
          </ul>
        </section>
      </div>

      <p className="text-xs text-muted-foreground">
        All {mod.pages.length} {mod.name} screens are in the sidebar, grouped by daily operations,
        configuration and reports.
      </p>
    </div>
  );
}
