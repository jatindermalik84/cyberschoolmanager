import { useEffect, useState } from "react";
import { CalendarClock, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { diffFields, logSignInAudit } from "@/lib/sign-in-audit";
import {
  BANNER_TONES,
  SIGN_IN_EVENT_COLUMNS,
  isEventRunning,
  type SignInEventRow,
} from "@/lib/sign-in-content";

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface Draft {
  id: string | null;
  name: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  priority: number;
  headline: string;
  description: string;
  banner_text: string;
  banner_tone: string;
  background_url: string;
}

function rowToDraft(row: SignInEventRow): Draft {
  return {
    id: row.id,
    name: row.name,
    starts_at: toLocalInput(row.starts_at),
    ends_at: toLocalInput(row.ends_at),
    is_active: row.is_active,
    priority: row.priority,
    headline: row.headline ?? "",
    description: row.description ?? "",
    banner_text: row.banner_text ?? "",
    banner_tone: row.banner_tone,
    background_url: row.background_url ?? "",
  };
}

function newDraft(): Draft {
  const start = new Date();
  const end = new Date(Date.now() + 7 * 86400000);
  return {
    id: null,
    name: "New event",
    starts_at: toLocalInput(start.toISOString()),
    ends_at: toLocalInput(end.toISOString()),
    is_active: true,
    priority: 0,
    headline: "",
    description: "",
    banner_text: "",
    banner_tone: "info",
    background_url: "",
  };
}

function snapshotOf(row: SignInEventRow): Record<string, unknown> {
  return {
    name: row.name,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
    is_active: row.is_active,
    priority: row.priority,
    headline: row.headline,
    description: row.description,
    banner_text: row.banner_text,
    banner_tone: row.banner_tone,
    background_url: row.background_url,
  };
}

function statusOf(draft: Draft) {
  if (!draft.id) return { label: "Unsaved", variant: "outline" as const };
  if (!draft.is_active) return { label: "Paused", variant: "outline" as const };
  const running = isEventRunning({
    is_active: draft.is_active,
    starts_at: new Date(draft.starts_at).toISOString(),
    ends_at: new Date(draft.ends_at).toISOString(),
  });
  if (running) return { label: "Live now", variant: "default" as const };
  return Date.parse(draft.starts_at) > Date.now()
    ? { label: "Scheduled", variant: "secondary" as const }
    : { label: "Ended", variant: "outline" as const };
}

export function SignInEventsCard({
  schoolId,
  onLogged,
}: {
  schoolId: string;
  onLogged?: () => void;
}) {
  const [drafts, setDrafts] = useState<Draft[] | null>(null);
  const [originals, setOriginals] = useState<Record<string, Record<string, unknown>>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data, error } = await supabase
        .from("sign_in_page_events")
        .select(SIGN_IN_EVENT_COLUMNS)
        .eq("school_id", schoolId)
        .order("starts_at", { ascending: true });
      if (cancelled) return;
      if (error) toast.error(error.message);
      const rows = (data ?? []) as SignInEventRow[];
      setDrafts(rows.map(rowToDraft));
      setOriginals(Object.fromEntries(rows.map((row) => [row.id, snapshotOf(row)])));
    })();
    return () => {
      cancelled = true;
    };
  }, [schoolId]);

  function patch(index: number, next: Partial<Draft>) {
    setDrafts((prev) => (prev ? prev.map((d, i) => (i === index ? { ...d, ...next } : d)) : prev));
  }

  async function save(index: number) {
    const draft = drafts?.[index];
    if (!draft) return;
    if (!draft.name.trim()) {
      toast.error("Give the event a name.");
      return;
    }
    const starts = new Date(draft.starts_at);
    const ends = new Date(draft.ends_at);
    if (Number.isNaN(starts.getTime()) || Number.isNaN(ends.getTime()) || ends <= starts) {
      toast.error("Set a valid date range — the end must be after the start.");
      return;
    }
    setSavingId(draft.id ?? `new-${index}`);
    const payload = {
      school_id: schoolId,
      name: draft.name.trim(),
      starts_at: starts.toISOString(),
      ends_at: ends.toISOString(),
      is_active: draft.is_active,
      priority: Number(draft.priority) || 0,
      headline: draft.headline.trim() || null,
      description: draft.description.trim() || null,
      banner_enabled: Boolean(draft.banner_text.trim()),
      banner_text: draft.banner_text.trim() || null,
      banner_tone: draft.banner_tone,
      background_url: draft.background_url.trim() || null,
    };
    const { data, error } = draft.id
      ? await supabase
          .from("sign_in_page_events")
          .update(payload)
          .eq("id", draft.id)
          .select(SIGN_IN_EVENT_COLUMNS)
          .single()
      : await supabase
          .from("sign_in_page_events")
          .insert(payload)
          .select(SIGN_IN_EVENT_COLUMNS)
          .single();
    setSavingId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    patch(index, rowToDraft(data as SignInEventRow));
    const saved = data as SignInEventRow;
    const before = draft.id ? originals[draft.id] ?? null : null;
    void logSignInAudit({
      schoolId,
      entity: "event",
      entityId: saved.id,
      entityLabel: saved.name,
      action: draft.id ? "updated" : "created",
      changedFields: diffFields(before, snapshotOf(saved)),
    }).then(() => onLogged?.());
    setOriginals((prev) => ({ ...prev, [saved.id]: snapshotOf(saved) }));
    toast.success("Event schedule saved.");
  }

  async function remove(index: number) {
    const draft = drafts?.[index];
    if (!draft) return;
    if (draft.id) {
      const { error } = await supabase.from("sign_in_page_events").delete().eq("id", draft.id);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Event removed.");
      void logSignInAudit({
        schoolId,
        entity: "event",
        entityId: draft.id,
        entityLabel: draft.name,
        action: "deleted",
      }).then(() => onLogged?.());
    }
    setDrafts((prev) => (prev ? prev.filter((_, i) => i !== index) : prev));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Scheduled events</CardTitle>
        <CardDescription>
          Plan admission drives, results days or festivals. Each event automatically takes over the
          sign-in page for its date range, then the regular content returns.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!drafts ? (
          <div className="flex h-24 items-center justify-center">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        ) : drafts.length === 0 ? (
          <p className="rounded-md border border-dashed border-border/70 px-3 py-6 text-center text-sm text-muted-foreground">
            No scheduled events yet.
          </p>
        ) : (
          drafts.map((draft, index) => {
            const status = statusOf(draft);
            return (
              <div key={draft.id ?? `new-${index}`} className="space-y-3 rounded-lg border border-border/70 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <CalendarClock className="size-4 text-muted-foreground" />
                  <Input
                    aria-label="Event name"
                    className="h-8 max-w-64"
                    value={draft.name}
                    onChange={(e) => patch(index, { name: e.target.value })}
                  />
                  <Badge variant={status.variant}>{status.label}</Badge>
                  <div className="ml-auto flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground" htmlFor={`active-${index}`}>
                      Active
                    </Label>
                    <Switch
                      id={`active-${index}`}
                      checked={draft.is_active}
                      onCheckedChange={(v) => patch(index, { is_active: v })}
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor={`from-${index}`}>Starts</Label>
                    <Input
                      id={`from-${index}`}
                      type="datetime-local"
                      value={draft.starts_at}
                      onChange={(e) => patch(index, { starts_at: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`to-${index}`}>Ends</Label>
                    <Input
                      id={`to-${index}`}
                      type="datetime-local"
                      value={draft.ends_at}
                      onChange={(e) => patch(index, { ends_at: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`prio-${index}`}>Priority</Label>
                    <Input
                      id={`prio-${index}`}
                      type="number"
                      value={draft.priority}
                      onChange={(e) => patch(index, { priority: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor={`headline-${index}`}>Headline override</Label>
                    <Input
                      id={`headline-${index}`}
                      placeholder="Leave blank to keep the regular headline"
                      value={draft.headline}
                      onChange={(e) => patch(index, { headline: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`evbg-${index}`}>Background image URL</Label>
                    <Input
                      id={`evbg-${index}`}
                      placeholder="https://…"
                      value={draft.background_url}
                      onChange={(e) => patch(index, { background_url: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`evdesc-${index}`}>Description override</Label>
                  <Textarea
                    id={`evdesc-${index}`}
                    rows={2}
                    placeholder="Leave blank to keep the regular description"
                    value={draft.description}
                    onChange={(e) => patch(index, { description: e.target.value })}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_200px]">
                  <div className="space-y-1.5">
                    <Label htmlFor={`evbanner-${index}`}>Banner text</Label>
                    <Textarea
                      id={`evbanner-${index}`}
                      rows={2}
                      value={draft.banner_text}
                      onChange={(e) => patch(index, { banner_text: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Banner style</Label>
                    <Select value={draft.banner_tone} onValueChange={(v) => patch(index, { banner_tone: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BANNER_TONES.map((tone) => (
                          <SelectItem key={tone.value} value={tone.value}>
                            {tone.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" onClick={() => void save(index)} disabled={savingId !== null}>
                    {savingId === (draft.id ?? `new-${index}`) ? <Loader2 className="animate-spin" /> : <Save />} Save event
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => void remove(index)}>
                    <Trash2 /> Remove
                  </Button>
                </div>
              </div>
            );
          })
        )}

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setDrafts((prev) => [...(prev ?? []), newDraft()])}
        >
          <Plus /> Add event
        </Button>
      </CardContent>
    </Card>
  );
}
