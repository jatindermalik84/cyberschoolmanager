import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight, ChevronRight, FileBarChart2, LayoutList, Search, Sliders, Wrench,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getDashboard } from "@/lib/erp.functions";
import { MODULE_BY_KEY, type ModuleArea, type ModulePage } from "@/lib/module-catalogue";
import { iconFor } from "./icon-map";
import { useWorkspace } from "./workspace";

const AREA_META: Record<ModuleArea, { title: string; caption: string; icon: typeof Wrench }> = {
  transaction: { title: "Daily operations", caption: "Day-to-day entry screens", icon: LayoutList },
  setup: { title: "Configuration", caption: "Masters this module runs on", icon: Sliders },
  report: { title: "Insights & reports", caption: "Printable and analytical outputs", icon: FileBarChart2 },
};

const RAIL_ORDER: ModuleArea[] = ["transaction", "setup", "report"];

const inr = (n: number) =>
  n >= 10000000 ? `₹${(n / 10000000).toFixed(2)} Cr`
    : n >= 100000 ? `₹${(n / 100000).toFixed(2)} L`
      : `₹${n.toLocaleString("en-IN")}`;

export function ModuleDashboard({ moduleKey }: { moduleKey: string }) {
  const { school } = useWorkspace();
  const mod = MODULE_BY_KEY[moduleKey];
  const Icon = iconFor(mod?.icon ?? "");
  const [q, setQ] = useState("");

  const { data, isPending } = useQuery({
    queryKey: ["dashboard", school?.id],
    queryFn: () => getDashboard({ data: { schoolId: school!.id } }),
    enabled: Boolean(school?.id),
  });

  const railGroups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return RAIL_ORDER.map((area) => ({
      area,
      pages: (mod?.pages ?? []).filter(
        (p) => p.area === area && (!needle || p.label.toLowerCase().includes(needle)),
      ),
    })).filter((g) => g.pages.length > 0);
  }, [mod, q]);

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

  return (
    <div className="flex min-h-full flex-col gap-6 xl:flex-row xl:gap-8">
      {/* Contextual module rail */}
      <aside className="w-full shrink-0 xl:w-72">
        <div className="rounded-2xl border bg-card xl:sticky xl:top-6">
          <div className="border-b p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={`Search ${mod.pages.length} screens`}
                aria-label={`Search ${mod.name} screens`}
                className="h-9 border-0 bg-muted pl-8 text-sm shadow-none focus-visible:ring-2"
              />
            </div>
          </div>

          <div className="max-h-[calc(100vh-11rem)] space-y-6 overflow-y-auto p-3">
            {railGroups.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                No screen matches “{q}”.
              </p>
            ) : (
              railGroups.map(({ area, pages }) => (
                <div key={area}>
                  <h3 className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    {AREA_META[area].title}
                    <span className="tnum float-right font-semibold">{pages.length}</span>
                  </h3>
                  <nav className="space-y-0.5">
                    {pages.map((p: ModulePage) => (
                      <Link
                        key={p.pageKey}
                        to="/m/$module/$page"
                        params={{ module: mod.key, page: p.pageKey }}
                        activeProps={{
                          className:
                            "rail-glow bg-primary/8 text-primary font-semibold",
                        }}
                        className="group flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary/6 hover:text-primary"
                      >
                        <span className="truncate">{p.label}</span>
                        <ChevronRight className="ml-auto size-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                      </Link>
                    ))}
                  </nav>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>

      {/* Main surface */}
      <div className="min-w-0 flex-1 space-y-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="size-5" />
            </div>
            <div>
              <nav className="mb-1 flex items-center text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <span>{mod.navGroup}</span>
                <ChevronRight className="mx-1 size-3" />
                <span className="text-foreground/70">Module</span>
              </nav>
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

        <div className="grid gap-5 lg:grid-cols-12">
          {RAIL_ORDER.map((area, idx) => {
            const pages = mod.pages.filter((p) => p.area === area);
            if (pages.length === 0) return null;
            const meta = AREA_META[area];
            const AreaIcon = meta.icon;
            const wide = idx === 0 || area === "report";
            const shown = pages.slice(0, wide ? 9 : 6);

            return (
              <section
                key={area}
                id={area}
                className={cn(
                  "min-w-0 scroll-mt-20 overflow-hidden rounded-2xl border bg-card",
                  wide ? "lg:col-span-8" : "lg:col-span-4",
                  area === "report" && "lg:col-span-12",
                )}
              >
                <header className="flex items-center justify-between gap-3 border-b px-6 py-4">
                  <h2 className="flex items-center gap-2.5 font-display text-base font-semibold">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <AreaIcon className="size-4" />
                    </span>
                    {meta.title}
                  </h2>
                  <span className="tnum rounded-md bg-primary/8 px-2 py-1 text-xs font-bold text-primary">
                    {pages.length}
                  </span>
                </header>
                <p className="px-6 pt-4 text-xs text-muted-foreground">{meta.caption}</p>
                <div
                  className={cn(
                    "grid gap-x-8 gap-y-1 p-6 pt-3",
                    wide ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-1",
                    area === "report" && "sm:grid-cols-2 lg:grid-cols-4",
                  )}
                >
                  {shown.map((p) => (
                    <Link
                      key={p.pageKey}
                      to="/m/$module/$page"
                      params={{ module: mod.key, page: p.pageKey }}
                      className="group flex items-center gap-2 rounded-lg py-1.5 text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
                    >
                      <span className="size-1.5 shrink-0 rounded-full bg-border transition-colors group-hover:bg-primary" />
                      <span className="truncate">{p.label}</span>
                    </Link>
                  ))}
                </div>
                {pages.length > shown.length ? (
                  <div className="border-t bg-muted/40 px-6 py-3">
                    <p className="text-xs font-semibold text-muted-foreground">
                      {pages.length - shown.length} more in the side panel
                    </p>
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
