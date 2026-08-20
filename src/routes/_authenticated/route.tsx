import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Suspense } from "react";

import { AppSidebar } from "@/components/shell/app-sidebar";
import { TopBar } from "@/components/shell/top-bar";
import { WorkspaceProvider } from "@/components/shell/workspace";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function ShellSkeleton() {
  return (
    <div className="flex min-h-svh flex-col gap-4 p-6">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

function AuthenticatedLayout() {
  return (
    <Suspense fallback={<ShellSkeleton />}>
      <WorkspaceProvider>
        <SidebarProvider defaultOpen={false}>
          <AppSidebar />
          <SidebarInset className="min-w-0">
            <TopBar />
            <main className="min-w-0 flex-1 p-4 md:p-6">
              <Outlet />
            </main>
          </SidebarInset>
        </SidebarProvider>
      </WorkspaceProvider>
    </Suspense>
  );
}
