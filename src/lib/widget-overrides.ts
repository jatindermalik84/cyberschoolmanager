import { supabase } from "@/integrations/supabase/client";
import type { ModuleDashboardSpec, TileSpec, WorklistSpec } from "@/lib/dashboard-spec";

export interface WidgetOverride {
  widget_id: string;
  label: string | null;
  answers: string | null;
  reconcile: string | null;
  note: string | null;
  hidden: boolean;
  sort_order: number | null;
}

export type OverrideMap = Record<string, WidgetOverride>;

/** Worklist rows are edited under this prefix so ids never collide with tiles. */
export const worklistWidgetId = (id: string) => `worklist:${id}`;

export async function fetchWidgetOverrides(schoolId: string, moduleKey: string): Promise<OverrideMap> {
  const { data, error } = await supabase
    .from("dashboard_widget_overrides")
    .select("widget_id, label, answers, reconcile, note, hidden, sort_order")
    .eq("school_id", schoolId)
    .eq("module_key", moduleKey);

  if (error) throw error;

  const map: OverrideMap = {};
  for (const row of data ?? []) map[row.widget_id] = row as WidgetOverride;
  return map;
}

const clean = (v: string | null | undefined) => {
  const t = (v ?? "").trim();
  return t.length ? t : null;
};

export async function saveWidgetOverrides(
  schoolId: string,
  moduleKey: string,
  rows: (WidgetOverride & { widget_id: string })[],
) {
  const payload = rows.map((r, i) => ({
    school_id: schoolId,
    module_key: moduleKey,
    widget_id: r.widget_id,
    label: clean(r.label),
    answers: clean(r.answers),
    reconcile: clean(r.reconcile),
    note: clean(r.note),
    hidden: r.hidden,
    sort_order: r.sort_order ?? i,
  }));

  const { error } = await supabase
    .from("dashboard_widget_overrides")
    .upsert(payload, { onConflict: "school_id,module_key,widget_id" });

  if (error) throw error;
}

export async function resetWidgetOverrides(schoolId: string, moduleKey: string) {
  const { error } = await supabase
    .from("dashboard_widget_overrides")
    .delete()
    .eq("school_id", schoolId)
    .eq("module_key", moduleKey);
  if (error) throw error;
}

function applyTile(tile: TileSpec, o: WidgetOverride | undefined): TileSpec {
  if (!o) return tile;
  return {
    ...tile,
    label: o.label ?? tile.label,
    answers: o.answers ?? tile.answers,
    ...(o.reconcile ?? tile.reconcile ? { reconcile: o.reconcile ?? tile.reconcile } : {}),
    ...(o.note ?? tile.note ? { note: o.note ?? tile.note } : {}),
  };
}

function applyWorklist(list: WorklistSpec, o: WidgetOverride | undefined): WorklistSpec {
  if (!o) return list;
  return {
    ...list,
    label: o.label ?? list.label,
    ...(o.note ?? list.note ? { note: o.note ?? list.note } : {}),
  };
}

/** Returns the spec with school-specific text, ordering and hidden widgets applied. */
export function applyOverrides(spec: ModuleDashboardSpec, overrides: OverrideMap): ModuleDashboardSpec {
  const tiles = spec.tiles
    .map((t, i) => ({ tile: applyTile(t, overrides[t.id]), order: overrides[t.id]?.sort_order ?? i }))
    .filter((x, i) => !overrides[spec.tiles[i]!.id]?.hidden)
    .sort((a, b) => a.order - b.order)
    .map((x) => x.tile);

  const worklists = spec.worklists
    .filter((w) => !overrides[worklistWidgetId(w.id)]?.hidden)
    .map((w) => applyWorklist(w, overrides[worklistWidgetId(w.id)]));

  const chartOverride = overrides["chart"];
  const chart = chartOverride
    ? {
        ...spec.chart,
        title: chartOverride.label ?? spec.chart.title,
        subtitle: chartOverride.answers ?? spec.chart.subtitle,
        ...(chartOverride.note ? { note: chartOverride.note } : {}),
      }
    : spec.chart;

  return { ...spec, tiles, worklists, chart };
}