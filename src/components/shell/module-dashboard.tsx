import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, LayoutList, Wrench, FileBarChart2 } from "lucide-react";

import { KpiCard } from "@/components/dashboard/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getDashboard } from "@/lib/erp.functions";
import { AREA_LABELS, MODULE_BY_KEY, pagesByArea, type ModuleArea } from "@/lib/module-catalogue";
import { iconFor } from "./icon-map";
import { useWorkspace } from "./workspace";

const AREA_ICON: Record<ModuleArea, typeof Wrench> = {
  setup: Wrench,
  transaction: LayoutList,
  report: FileBarChart2,
};

const AREA_HINT: Record<ModuleArea, string> = {
  setup: "Masters and configuration that this module runs on",
  transaction: "Day-to-day entry screens",
  report: "Printable and analytical outputs",
};

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

  const groups = pagesByArea(mod);
  const onRoll = (data?.classes ?? []).reduce((s, c) => s + (c.strength ?? 0), 0);
  const latestFee = data?.fees.at(-1);
  const latestAtt = data?.attendance[0];

  const kpis: { label: string; value: string; hint?: string }[] = (() => {
    switch (mod.key) {
      case "students":
      case "enquiry":
      case "classes":
        return [
          { label: "Students on roll", value: onRoll.toLocaleString("en-IN") },
          { label: "Class sections", value: String(data?.classes.length ?? 0) },
          { label: "Detailed records", value: String(data?.studentCount ?? 0) },
        ];
      case "fee":
        return [
          { label: "Collected (month)", value: latestFee ? inr(Number(latestFee.collected_amount)) : "—" },
          { label: "Demand raised", value: latestFee ? inr(Number(latestFee.demand_amount)) : "—" },
          { label: "Defaulters", value: String(latestFee?.defaulter_count ?? 0) },
        ];
      case "attendance":
        return [
          { label: "Present today", value: String(latestAtt?.present_count ?? "—") },
          { label: "Absent today", value: String(latestAtt?.absent_count ?? "—") },
          { label: "Marked against", value: String(latestAtt?.total_count ?? "—") },
        ];
      case "hr":
      case "payroll":
        return [
          { label: "Active staff", value: String(data?.staffCount ?? 0) },
          { label: "Salary runs", value: "—", hint: "Awaiting data" },
          { label: "Open leave requests", value: "—", hint: "Awaiting data" },
        ];
      default:
        return [
          { label: "Setup screens", value: String(mod.pages.filter((p) => p.area === "setup").length) },
          { label: "Daily work screens", value: String(mod.pages.filter((p) => p.area === "transaction").length) },
          { label: "Reports", value: String(mod.pages.filter((p) => p.area === "report").length) },
        ];
    }
  })();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">{mod.name}</h1>
            <p className="text-sm text-muted-foreground">
              {mod.pages.length} screens carried over from the existing ERP
              {school ? ` · ${school.name}` : ""}
            </p>
          </div>
        </div>
        <Badge variant="secondary">Module dashboard</Badge>
      </div>

      {isPending && school ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          {kpis.map((k, i) => (
            <KpiCard
              key={k.label}
              icon={Icon}
              label={k.label}
              value={k.value}
              {...(k.hint ? { hint: k.hint } : {})}
              tone={i === 1 ? "accent" : i === 2 ? "success" : "default"}
            />
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {groups.map(({ area, pages }) => {
          const AreaIcon = AREA_ICON[area];
          return (
            <Card key={area} className="min-w-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AreaIcon className="size-4 text-muted-foreground" />
                  {AREA_LABELS[area]}
                  <span className="tnum ml-auto text-sm font-normal text-muted-foreground">
                    {pages.length}
                  </span>
                </CardTitle>
                <CardDescription>{AREA_HINT[area]}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-0.5">
                {pages.map((p) => (
                  <Link
                    key={p.pageKey}
                    to="/m/$module/$page"
                    params={{ module: mod.key, page: p.pageKey }}
                    className="group flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                  >
                    <span className="truncate">{p.label}</span>
                    <ArrowRight className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                  </Link>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
