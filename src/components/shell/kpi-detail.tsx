import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, ArrowDownRight, Minus, FileText } from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { inr, type DashData, type TileSpec } from "@/lib/dashboard-spec";
import type { ModulePage } from "@/lib/module-catalogue";

type Row = { label: string; value: string; meta?: string };

const nf = (n: number) => n.toLocaleString("en-IN");

/** Picks the breakdown that best explains a tile, from the data the dashboard already has. */
function breakdownFor(tile: TileSpec, d: DashData): { title: string; caption: string; rows: Row[]; chart: { label: string; value: number }[] } {
  const id = tile.id.toLowerCase();
  const text = `${id} ${tile.label}`.toLowerCase();

  if (/fee|collect|due|defaul|outstand|revenue|receipt|concession/.test(text)) {
    const rows = [...d.fees].reverse().map((f) => {
      const collected = Number(f.collected_amount) || 0;
      const demand = Number(f.demand_amount) || 0;
      const pct = demand ? Math.round((collected / demand) * 100) : 0;
      return {
        label: new Date(f.month_start).toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
        value: inr(collected),
        meta: `${pct}% of ${inr(demand)} demand · ${f.defaulter_count ?? 0} defaulters`,
      };
    });
    return {
      title: "Month-by-month collection",
      caption: "Collected against demand raised, latest month first",
      rows,
      chart: [...d.fees].map((f) => ({
        label: new Date(f.month_start).toLocaleDateString("en-IN", { month: "short" }),
        value: Number(f.collected_amount) || 0,
      })),
    };
  }

  if (/attend|present|absent|leave|late/.test(text)) {
    const rows = d.attendance.map((a) => {
      const total = a.total_count ?? 0;
      const pct = total ? Math.round(((a.present_count ?? 0) / total) * 100) : 0;
      return {
        label: new Date(a.attendance_date).toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" }),
        value: `${pct}%`,
        meta: `${nf(a.present_count ?? 0)} present · ${nf(a.absent_count ?? 0)} absent of ${nf(total)}`,
      };
    });
    return {
      title: "Last five marking days",
      caption: "Present share against the day's total roll",
      rows,
      chart: [...d.attendance].reverse().map((a) => ({
        label: new Date(a.attendance_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
        value: a.present_count ?? 0,
      })),
    };
  }

  const rows = d.classes.map((c) => ({
    label: `${c.name}${c.section ? ` · ${c.section}` : ""}`,
    value: nf(c.strength ?? 0),
    meta: "students on roll",
  }));
  return {
    title: "Class-wise breakdown",
    caption: "Strength per class section, in class order",
    rows,
    chart: d.classes.map((c) => ({
      label: `${c.name}${c.section ? `-${c.section}` : ""}`,
      value: c.strength ?? 0,
    })),
  };
}

export function KpiDetailSheet({
  tile, data, moduleKey, reports, open, onOpenChange,
}: {
  tile: TileSpec | null;
  data: DashData | undefined;
  moduleKey: string;
  reports: ModulePage[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const value = tile?.compute && data ? tile.compute(data) : null;
  const breakdown = tile && data ? breakdownFor(tile, data) : null;
  const money = breakdown?.title === "Month-by-month collection";

  const showGender =
    !!tile &&
    /student|strength|roll|enrol|admission/.test(`${tile.id} ${tile.label}`.toLowerCase());

  const genderRows = showGender ? (data?.gender ?? []) : [];

  const classRows = data?.classes.map((c) => {
    const label = `${c.name}${c.section ? ` · ${c.section}` : ""}`;
    const genderLabel = `${c.name}${c.section ? `-${c.section}` : ""}`;
    const g = genderRows.find((r) => r.label === genderLabel) ?? { male: 0, female: 0, other: 0 };
    return { label, total: c.strength ?? 0, male: g.male, female: g.female, other: g.other };
  }) ?? [];
  const classTotals = classRows.reduce(
    (acc, r) => ({ total: acc.total + r.total, male: acc.male + r.male, female: acc.female + r.female, other: acc.other + r.other }),
    { total: 0, male: 0, female: 0, other: 0 },
  );
  const hasOther = classTotals.other > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        {tile ? (
          <>
            <SheetHeader className="space-y-1 text-left">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                {tile.label}
              </p>
              <SheetTitle className="tnum font-display text-4xl font-bold leading-none">
                {value?.value ?? "—"}
              </SheetTitle>
              <SheetDescription>{value?.coverage ?? tile.answers}</SheetDescription>
            </SheetHeader>

            <div className="space-y-6 px-4 pb-8">
              {value?.delta ? (
                <p
                  className={cn(
                    "inline-flex items-center gap-1 text-sm font-medium",
                    value.delta.direction === "up" && "text-success",
                    value.delta.direction === "down" && "text-destructive",
                    value.delta.direction === "flat" && "text-muted-foreground",
                  )}
                >
                  {value.delta.direction === "up" ? <ArrowUpRight className="size-4" />
                    : value.delta.direction === "down" ? <ArrowDownRight className="size-4" />
                      : <Minus className="size-4" />}
                  {value.delta.value}
                  <span className="font-normal text-muted-foreground">{value.delta.label}</span>
                </p>
              ) : null}


              {!showGender && breakdown && breakdown.rows.length ? (
                <section className="space-y-3">
                  <div>
                    <h3 className="font-display text-sm font-semibold">{breakdown.title}</h3>
                    <p className="text-xs text-muted-foreground">{breakdown.caption}</p>
                  </div>

                  <div className="h-44 rounded-xl border bg-card p-3">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={breakdown.chart} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={10} interval={0} />
                        <YAxis tickLine={false} axisLine={false} fontSize={10} width={44} />
                        <Tooltip
                          cursor={{ fill: "var(--color-muted)" }}
                          formatter={(v: number) => (money ? inr(v) : nf(v))}
                        />
                        <Bar dataKey="value" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <ul className="divide-y rounded-xl border bg-card">
                    {breakdown.rows.map((r) => (
                      <li key={r.label} className="flex items-center justify-between gap-3 px-4 py-2.5">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{r.label}</p>
                          {r.meta ? <p className="truncate text-xs text-muted-foreground">{r.meta}</p> : null}
                        </div>
                        <span className="tnum shrink-0 text-sm font-semibold">{r.value}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}


              {showGender && classRows.length ? (
                <section className="space-y-3">
                  <div className="h-52 rounded-xl border bg-card p-3">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={classRows} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={10} interval={0} />
                        <YAxis tickLine={false} axisLine={false} fontSize={10} width={32} allowDecimals={false} />
                        <Tooltip cursor={{ fill: "var(--color-muted)" }} formatter={(v: number) => nf(v)} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="male" stackId="g" name="Boys" fill="var(--color-primary)" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="female" stackId="g" name="Girls" fill="var(--color-accent)" radius={hasOther ? [0, 0, 0, 0] : [6, 6, 0, 0]} />
                        {hasOther ? (
                          <Bar dataKey="other" stackId="g" name="Other" fill="var(--color-muted-foreground)" radius={[6, 6, 0, 0]} />
                        ) : null}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="overflow-hidden rounded-xl border bg-card">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="border-b bg-muted/40 text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                          <th className="px-4 py-2 text-left font-semibold">Class</th>
                          <th className="w-16 px-3 py-2 text-right font-semibold">Total</th>
                          <th className="w-16 px-3 py-2 text-right font-semibold">Boys</th>
                          <th className="w-16 px-4 py-2 text-right font-semibold">Girls</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {classRows.map((r) => (
                          <tr key={r.label} className="transition-colors hover:bg-muted/30">
                            <td className="max-w-0 truncate px-4 py-2 font-medium">{r.label}</td>
                            <td className="tnum px-3 py-2 text-right font-semibold">{nf(r.total)}</td>
                            <td className="tnum px-3 py-2 text-right text-muted-foreground">{nf(r.male)}</td>
                            <td className="tnum px-4 py-2 text-right text-muted-foreground">{nf(r.female)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t bg-muted/40 font-semibold">
                          <td className="px-4 py-2">All sections</td>
                          <td className="tnum px-3 py-2 text-right">{nf(classTotals.total)}</td>
                          <td className="tnum px-3 py-2 text-right">{nf(classTotals.male)}</td>
                          <td className="tnum px-4 py-2 text-right">{nf(classTotals.female)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </section>
              ) : null}

              {reports.length ? (
                <section className="space-y-2">
                  <h3 className="font-display text-sm font-semibold">Go deeper</h3>
                  {reports.slice(0, 4).map((p) => (
                    <Link
                      key={p.pageKey}
                      to="/m/$module/$page"
                      params={{ module: moduleKey, page: p.pageKey }}
                      onClick={() => onOpenChange(false)}
                      className="group flex items-center gap-3 rounded-xl border bg-card px-4 py-3 transition hover:border-primary/40 hover:bg-primary/5"
                    >
                      <FileText className="size-4 shrink-0 text-muted-foreground group-hover:text-primary" />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{p.label}</span>
                      <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
                    </Link>
                  ))}
                </section>
              ) : null}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
