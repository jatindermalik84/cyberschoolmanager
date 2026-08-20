import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ModuleDashboardSpec } from "@/lib/dashboard-spec";
import {
  resetWidgetOverrides, saveWidgetOverrides, worklistWidgetId,
  type OverrideMap, type WidgetOverride,
} from "@/lib/widget-overrides";

type Kind = "tile" | "chart" | "worklist";

interface Draft extends WidgetOverride {
  kind: Kind;
  /** untouched text from the code-level spec, shown as placeholder */
  defaults: { label: string; answers: string; reconcile: string; note: string };
}

function buildDrafts(spec: ModuleDashboardSpec, overrides: OverrideMap): Draft[] {
  const tiles: Draft[] = spec.tiles.map((t, i) => {
    const o = overrides[t.id];
    return {
      kind: "tile" as const,
      widget_id: t.id,
      label: o?.label ?? null,
      answers: o?.answers ?? null,
      reconcile: o?.reconcile ?? null,
      note: o?.note ?? null,
      hidden: o?.hidden ?? false,
      sort_order: o?.sort_order ?? i,
      defaults: { label: t.label, answers: t.answers, reconcile: t.reconcile ?? "", note: t.note ?? "" },
    };
  }).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  const chartO = overrides["chart"];
  const chart: Draft = {
    kind: "chart" as const,
    widget_id: "chart",
    label: chartO?.label ?? null,
    answers: chartO?.answers ?? null,
    reconcile: null,
    note: chartO?.note ?? null,
    hidden: false,
    sort_order: 0,
    defaults: { label: spec.chart.title, answers: spec.chart.subtitle, reconcile: "", note: spec.chart.note ?? "" },
  };

  const worklists: Draft[] = spec.worklists.map((w, i) => {
    const o = overrides[worklistWidgetId(w.id)];
    return {
      kind: "worklist" as const,
      widget_id: worklistWidgetId(w.id),
      label: o?.label ?? null,
      answers: null,
      reconcile: null,
      note: o?.note ?? null,
      hidden: o?.hidden ?? false,
      sort_order: o?.sort_order ?? i,
      defaults: { label: w.label, answers: "", reconcile: "", note: w.note ?? "" },
    };
  });

  return [...tiles, chart, ...worklists];
}

function Field({
  label, value, placeholder, onChange, multiline,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </Label>
      {multiline ? (
        <Textarea rows={2} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <Input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}

export function WidgetEditor({
  open, onOpenChange, moduleKey, moduleName, schoolId, spec, overrides,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  moduleKey: string;
  moduleName: string;
  schoolId: string;
  /** the untouched, code-level spec — placeholders come from here */
  spec: ModuleDashboardSpec;
  overrides: OverrideMap;
}) {
  const qc = useQueryClient();
  const initial = useMemo(() => buildDrafts(spec, overrides), [spec, overrides]);
  const [drafts, setDrafts] = useState<Draft[]>(initial);

  useEffect(() => { if (open) setDrafts(initial); }, [open, initial]);

  const patch = (id: string, part: Partial<Draft>) =>
    setDrafts((d) => d.map((x) => (x.widget_id === id ? { ...x, ...part } : x)));

  const move = (id: string, dir: -1 | 1) =>
    setDrafts((d) => {
      const tiles = d.filter((x) => x.kind === "tile");
      const i = tiles.findIndex((x) => x.widget_id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= tiles.length) return d;
      const reordered = [...tiles];
      [reordered[i], reordered[j]] = [reordered[j]!, reordered[i]!];
      const withOrder = reordered.map((t, k) => ({ ...t, sort_order: k }));
      return [...withOrder, ...d.filter((x) => x.kind !== "tile")];
    });

  const save = useMutation({
    mutationFn: () => saveWidgetOverrides(schoolId, moduleKey, drafts),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["widget-overrides", schoolId, moduleKey] });
      toast.success("Dashboard widgets updated");
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message || "Could not save widget settings"),
  });

  const reset = useMutation({
    mutationFn: () => resetWidgetOverrides(schoolId, moduleKey),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["widget-overrides", schoolId, moduleKey] });
      toast.success("Reset to the standard wording");
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message || "Could not reset"),
  });

  const tiles = drafts.filter((d) => d.kind === "tile");
  const chart = drafts.find((d) => d.kind === "chart");
  const worklists = drafts.filter((d) => d.kind === "worklist");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>Edit {moduleName} dashboard widgets</SheetTitle>
          <SheetDescription>
            Change the tile name, the question it answers and the register it reconciles against.
            Leave a field empty to keep the standard wording.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          <section className="space-y-4">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              KPI tiles
            </h3>
            {tiles.map((t, i) => (
              <div
                key={t.widget_id}
                className={cn("space-y-3 rounded-xl border p-4", t.hidden && "bg-muted/40 opacity-70")}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold">{t.label ?? t.defaults.label}</p>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button type="button" size="icon" variant="ghost" className="size-7"
                      disabled={i === 0} onClick={() => move(t.widget_id, -1)} aria-label="Move up">
                      <ChevronUp className="size-4" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" className="size-7"
                      disabled={i === tiles.length - 1} onClick={() => move(t.widget_id, 1)} aria-label="Move down">
                      <ChevronDown className="size-4" />
                    </Button>
                    <Switch
                      checked={!t.hidden}
                      onCheckedChange={(v) => patch(t.widget_id, { hidden: !v })}
                      aria-label="Show this tile"
                    />
                  </div>
                </div>
                <Field label="Tile name" value={t.label ?? ""} placeholder={t.defaults.label}
                  onChange={(v) => patch(t.widget_id, { label: v })} />
                <Field label="Question it answers" value={t.answers ?? ""} placeholder={t.defaults.answers}
                  onChange={(v) => patch(t.widget_id, { answers: v })} />
                <Field label="Reconciles to (register / report)" value={t.reconcile ?? ""}
                  placeholder={t.defaults.reconcile || "No register mapped"}
                  onChange={(v) => patch(t.widget_id, { reconcile: v })} />
                <Field label="Explanatory note" multiline value={t.note ?? ""}
                  placeholder={t.defaults.note || "Shown on the info icon"}
                  onChange={(v) => patch(t.widget_id, { note: v })} />
              </div>
            ))}
            {tiles.length === 0 ? (
              <p className="text-sm text-muted-foreground">This module has no KPI tiles yet.</p>
            ) : null}
          </section>

          {chart ? (
            <section className="space-y-3">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Trend chart
              </h3>
              <div className="space-y-3 rounded-xl border p-4">
                <Field label="Chart title" value={chart.label ?? ""} placeholder={chart.defaults.label}
                  onChange={(v) => patch("chart", { label: v })} />
                <Field label="Chart subtitle" value={chart.answers ?? ""} placeholder={chart.defaults.answers}
                  onChange={(v) => patch("chart", { answers: v })} />
                <Field label="Explanatory note" multiline value={chart.note ?? ""}
                  placeholder={chart.defaults.note || "Shown on the info icon"}
                  onChange={(v) => patch("chart", { note: v })} />
              </div>
            </section>
          ) : null}

          {worklists.length ? (
            <section className="space-y-3">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Worklists
              </h3>
              {worklists.map((w) => (
                <div key={w.widget_id}
                  className={cn("space-y-3 rounded-xl border p-4", w.hidden && "bg-muted/40 opacity-70")}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold">{w.label ?? w.defaults.label}</p>
                    <Switch checked={!w.hidden} onCheckedChange={(v) => patch(w.widget_id, { hidden: !v })}
                      aria-label="Show this worklist" />
                  </div>
                  <Field label="Worklist name" value={w.label ?? ""} placeholder={w.defaults.label}
                    onChange={(v) => patch(w.widget_id, { label: v })} />
                  <Field label="Explanatory note" multiline value={w.note ?? ""}
                    placeholder={w.defaults.note || "Shown on the info icon"}
                    onChange={(v) => patch(w.widget_id, { note: v })} />
                </div>
              ))}
            </section>
          ) : null}
        </div>

        <SheetFooter className="flex-row items-center justify-between gap-3 border-t px-6 py-4">
          <Button type="button" variant="ghost" onClick={() => reset.mutate()} disabled={reset.isPending}>
            {reset.isPending ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
            Reset to standard
          </Button>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="button" onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Save changes
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}