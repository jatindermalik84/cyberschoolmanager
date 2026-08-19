import { useEffect, useState } from "react";
import { History, Loader2, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { AUDIT_COLUMNS, fieldLabel, type AuditEntryRow } from "@/lib/sign-in-audit";

function actionVariant(action: string) {
  if (action === "created") return "default" as const;
  if (action === "deleted") return "destructive" as const;
  return "secondary" as const;
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function SignInAuditLogCard({
  schoolId,
  refreshToken = 0,
}: {
  schoolId: string;
  refreshToken?: number;
}) {
  const [entries, setEntries] = useState<AuditEntryRow[] | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setEntries(null);
    void (async () => {
      const { data } = await supabase
        .from("sign_in_page_audit_log")
        .select(AUDIT_COLUMNS)
        .eq("school_id", schoolId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (!cancelled) setEntries((data ?? []) as AuditEntryRow[]);
    })();
    return () => {
      cancelled = true;
    };
  }, [schoolId, refreshToken, reload]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="space-y-1.5">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="size-4 text-muted-foreground" /> Change history
          </CardTitle>
          <CardDescription>
            Every edit to the sign-in page content and its scheduled events — who changed what and when.
          </CardDescription>
        </div>
        <Button size="sm" variant="ghost" onClick={() => setReload((n) => n + 1)} aria-label="Refresh history">
          <RefreshCw />
        </Button>
      </CardHeader>
      <CardContent>
        {!entries ? (
          <div className="flex h-20 items-center justify-center">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        ) : entries.length === 0 ? (
          <p className="rounded-md border border-dashed border-border/70 px-3 py-6 text-center text-sm text-muted-foreground">
            No changes recorded yet.
          </p>
        ) : (
          <ol className="space-y-3">
            {entries.map((entry) => (
              <li key={entry.id} className="flex gap-3 rounded-lg border border-border/70 p-3">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={actionVariant(entry.action)} className="capitalize">
                      {entry.action}
                    </Badge>
                    <span className="text-sm font-medium">
                      {entry.entity === "event"
                        ? `Scheduled event · ${entry.entity_label ?? "Untitled"}`
                        : "Sign-in page content"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {entry.actor_name} · {formatWhen(entry.created_at)}
                  </p>
                  {entry.changed_fields.length > 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Changed: {entry.changed_fields.map(fieldLabel).join(", ")}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}