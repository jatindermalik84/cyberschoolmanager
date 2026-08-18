import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Hammer } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AREA_LABELS, MODULE_BY_KEY } from "@/lib/module-catalogue";

export const Route = createFileRoute("/_authenticated/m/$module/$page")({
  head: ({ params }) => {
    const mod = MODULE_BY_KEY[params.module];
    const page = mod?.pages.find((p) => p.pageKey === params.page);
    const title = page ? `${page.label} · ${mod!.name} | Cyber School Manager` : "Screen | Cyber School Manager";
    const description = page
      ? `${page.label} in the ${mod!.name} module of Cyber School Manager.`
      : "Cyber School Manager module screen.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  loader: ({ params }) => {
    const mod = MODULE_BY_KEY[params.module];
    const page = mod?.pages.find((p) => p.pageKey === params.page);
    if (!mod || !page) throw notFound();
    return { moduleName: mod.name, moduleRoute: mod.route, page };
  },
  component: PlannedScreen,
});

function PlannedScreen() {
  const { moduleName, moduleRoute, page } = Route.useLoaderData();

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          {moduleName} · {AREA_LABELS[page.area]}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold">{page.label}</h1>
          <Badge variant="outline">Planned</Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Hammer className="size-4 text-muted-foreground" /> Not built yet
          </CardTitle>
          <CardDescription>
            This screen is carried over from the existing ERP (legacy page{" "}
            <code className="font-mono text-xs">{page.pageKey}.aspx</code>) and will be rebuilt on the
            new multi-tenant foundation in a later phase.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button asChild variant="secondary" size="sm">
            <Link to={moduleRoute as "/dashboard"}>
              <ArrowLeft /> Back to {moduleName}
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to="/dashboard">Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
