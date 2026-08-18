import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Activity, CalendarCheck, GraduationCap, IndianRupee, TriangleAlert, Users,
} from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

import { KpiCard } from "@/components/dashboard/kpi-card";
import { useWorkspace } from "@/components/shell/workspace";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { getDashboard } from "@/lib/erp.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard | Cyber School Manager" },
      {
        name: "description",
        content:
          "Live enrolment, staffing, fee collection and attendance figures for your school in one workspace.",
      },
      { property: "og:title", content: "Dashboard | Cyber School Manager" },
      {
        property: "og:description",
        content: "Live enrolment, staffing, fee collection and attendance figures for your school.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DashboardPage,
});

const inr = (n: number) =>
  n >= 10000000
    ? `₹${(n / 10000000).toFixed(2)} Cr`
    : n >= 100000
      ? `₹${(n / 100000).toFixed(2)} L`
      : `₹${n.toLocaleString("en-IN")}`;

const monthLabel = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { month: "short" });

function DashboardPage() {
  const { school, session, profile } = useWorkspace();

  const { data, isPending } = useQuery({
    queryKey: ["dashboard", school?.id],
    queryFn: () => getDashboard({ data: { schoolId: school!.id } }),
    enabled: Boolean(school?.id),
  });

  if (!school) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle>No school assigned</CardTitle>
          <CardDescription>
            Your account is not linked to a school yet. Ask your administrator to assign you a role.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isPending || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  const latestFee = data.fees.at(-1);
  const collectionRate = latestFee?.demand_amount
    ? Math.round((Number(latestFee.collected_amount) / Number(latestFee.demand_amount)) * 100)
    : 0;
  const latestAttendance = data.attendance[0];
  const attendanceRate = latestAttendance?.total_count
    ? Math.round((latestAttendance.present_count / latestAttendance.total_count) * 100)
    : 0;

  const feeChart = data.fees.map((f) => ({
    month: monthLabel(f.month_start),
    collected: Number(f.collected_amount) / 100000,
    demand: Number(f.demand_amount) / 100000,
  }));

  const maxStrength = Math.max(1, ...data.classes.map((c) => c.strength ?? 0));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            Good to see you{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground">
            {school.name}
            {school.city ? ` · ${school.city}` : ""}
            {session ? ` · Session ${session.label}` : ""}
          </p>
        </div>
        <Badge variant="secondary" className="gap-1.5">
          <Activity className="size-3.5" /> Live data
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={GraduationCap}
          label="Active students"
          value={data.studentCount.toLocaleString("en-IN")}
          hint={`${data.classes.length} classes on roll`}
        />
        <KpiCard
          icon={Users}
          label="Active staff"
          value={data.staffCount.toLocaleString("en-IN")}
          hint="Teaching and support"
          tone="accent"
        />
        <KpiCard
          icon={IndianRupee}
          label="Fee collected (month)"
          value={latestFee ? inr(Number(latestFee.collected_amount)) : "—"}
          hint={latestFee ? `${collectionRate}% of demand raised` : undefined}
          tone="success"
        />
        <KpiCard
          icon={CalendarCheck}
          label="Attendance today"
          value={latestAttendance ? `${attendanceRate}%` : "—"}
          hint={
            latestAttendance
              ? `${latestAttendance.present_count} present · ${latestAttendance.absent_count} absent`
              : undefined
          }
          tone="warning"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Fee collection vs demand</CardTitle>
            <CardDescription>Amounts in ₹ lakh, current session to date</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px] pl-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={feeChart} margin={{ top: 4, right: 12, bottom: 0, left: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} width={38} />
                <Tooltip
                  cursor={{ fill: "var(--muted)" }}
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    fontSize: 12,
                  }}
                  formatter={(v: number, name) => [`₹${v.toFixed(2)} L`, name === "collected" ? "Collected" : "Demand"]}
                />
                <Bar dataKey="demand" fill="var(--muted)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="collected" radius={[4, 4, 0, 0]}>
                  {feeChart.map((_, i) => (
                    <Cell key={i} fill="var(--chart-1)" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent activity</CardTitle>
            <CardDescription>Across this school</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.activity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
            ) : (
              data.activity.map((a) => (
                <div key={a.id} className="flex gap-3 border-b pb-3 last:border-0 last:pb-0">
                  <div className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
                  <div className="min-w-0 text-sm">
                    <p className="leading-snug">
                      <span className="font-medium">{a.actor_name}</span> {a.action}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {a.entity} ·{" "}
                      {new Date(a.occurred_at).toLocaleString("en-IN", {
                        day: "numeric", month: "short", hour: "numeric", minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Class strength</CardTitle>
            <CardDescription>Students on roll per class section</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {data.classes.map((c) => (
              <div key={`${c.name}-${c.section}`} className="space-y-1.5">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-medium">
                    {c.name} {c.section}
                  </span>
                  <span className="tnum text-muted-foreground">{c.strength}</span>
                </div>
                <Progress value={((c.strength ?? 0) / maxStrength) * 100} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TriangleAlert className="size-4 text-warning" /> Fee defaulters
            </CardTitle>
            <CardDescription>Outstanding for the latest month</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="tnum font-display text-4xl font-semibold">
              {latestFee?.defaulter_count ?? 0}
            </p>
            <p className="text-sm text-muted-foreground">
              {latestFee
                ? `${inr(Number(latestFee.demand_amount) - Number(latestFee.collected_amount))} still to be collected against ${monthLabel(latestFee.month_start)} demand.`
                : "No fee demand raised yet."}
            </p>
            <Progress value={collectionRate} className="h-2" />
            <p className="text-xs text-muted-foreground">{collectionRate}% collected</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
