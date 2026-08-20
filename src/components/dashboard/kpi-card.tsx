import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function KpiCard({
  label, value, hint, icon: Icon, tone = "primary", onClick,
}: {
  label: string;
  value: string;
  hint?: string | undefined;
  icon: LucideIcon;
  tone?: "primary" | "accent" | "success" | "warning";
  onClick?: () => void;
}) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/15 text-accent-foreground",
    success: "bg-success/12 text-success",
    warning: "bg-warning/15 text-warning-foreground",
  } as const;

  const clickable = Boolean(onClick);

  return (
    <Card
      className={cn(
        "overflow-hidden",
        clickable &&
          "cursor-pointer transition hover:border-primary/40 hover:shadow-[0_8px_20px_-10px_color-mix(in_oklab,var(--color-primary)_40%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
      {...(clickable
        ? {
            role: "button" as const,
            tabIndex: 0,
            onClick,
            onKeyDown: (e: React.KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            },
            "aria-label": `${label} — view details`,
          }
        : {})}
    >
      <CardContent className="flex items-start gap-3 p-4">
        <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-md", tones[tone])}>
          <Icon className="size-4" />
        </div>
        <div className="min-w-0 space-y-0.5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="tnum font-display text-xl font-semibold leading-tight">{value}</p>
          {hint ? <p className="truncate text-[11px] text-muted-foreground">{hint}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
