import { supabase } from "@/integrations/supabase/client";

export interface AuditEntryRow {
  id: string;
  actor_name: string;
  entity: string;
  entity_label: string | null;
  action: string;
  changed_fields: string[];
  created_at: string;
}

export const AUDIT_COLUMNS = "id, actor_name, entity, entity_label, action, changed_fields, created_at";

const FIELD_LABELS: Record<string, string> = {
  slug: "Link name",
  brand_name: "School name",
  logo_url: "Logo",
  background_url: "Background image",
  headline: "Headline",
  description: "Description",
  highlights: "Highlight points",
  banner_enabled: "Banner visibility",
  banner_text: "Banner text",
  banner_tone: "Banner style",
  is_published: "Published state",
  name: "Event name",
  starts_at: "Start date",
  ends_at: "End date",
  is_active: "Active state",
  priority: "Priority",
};

export function fieldLabel(field: string) {
  return FIELD_LABELS[field] ?? field.replace(/_/g, " ");
}

function normalise(value: unknown) {
  if (Array.isArray(value)) return JSON.stringify(value);
  if (value === null || value === undefined || value === "") return "";
  return String(value);
}

/** Returns the keys whose value changed between two payload snapshots. */
export function diffFields(
  before: Record<string, unknown> | null,
  after: Record<string, unknown>,
): string[] {
  if (!before) return Object.keys(after).filter((key) => normalise(after[key]) !== "");
  return Object.keys(after).filter((key) => normalise(before[key]) !== normalise(after[key]));
}

export async function logSignInAudit(input: {
  schoolId: string;
  entity: "page" | "event";
  entityId?: string | null;
  entityLabel?: string | null;
  action: "created" | "updated" | "deleted";
  changedFields?: string[];
}) {
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return;
  const actorName =
    (user.user_metadata?.["full_name"] as string | undefined) ??
    (user.user_metadata?.["name"] as string | undefined) ??
    user.email ??
    "Unknown user";
  await supabase.from("sign_in_page_audit_log").insert({
    school_id: input.schoolId,
    actor_id: user.id,
    actor_name: actorName,
    entity: input.entity,
    entity_id: input.entityId ?? null,
    entity_label: input.entityLabel ?? null,
    action: input.action,
    changed_fields: input.changedFields ?? [],
  });
}