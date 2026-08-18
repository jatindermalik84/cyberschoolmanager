import { Link } from "@tanstack/react-router";
import { ArrowLeft, Hammer } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { iconFor } from "./icon-map";
import { useWorkspace } from "./workspace";

export function ModulePlaceholder({ route }: { route: string }) {
  const { modules, school } = useWorkspace();
  const module = modules.find((m) => m.route === route);
  const Icon = iconFor(module?.icon ?? "");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-6" />
        </div>
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold">{module?.name ?? "Module"}</h1>
            <Badge variant="outline" className="border-accent/50 bg-accent/10 text-accent-foreground">
              Coming soon
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {module?.description ?? "This module is part of the phased rewrite."}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Hammer className="size-4 text-muted-foreground" />
            Planned for a later phase
          </CardTitle>
          <CardDescription>
            The prototype ships the shell: unified sign-in, tenant switching and the live dashboard.
            This module will be built on the same multi-tenant foundation, scoped to{" "}
            <span className="font-medium text-foreground">{school?.name ?? "your school"}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="secondary" size="sm">
            <Link to="/dashboard">
              <ArrowLeft /> Back to dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
