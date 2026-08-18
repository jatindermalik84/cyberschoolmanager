import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight, LayoutDashboard } from "lucide-react";

import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { iconFor } from "./icon-map";
import { useWorkspace } from "./workspace";
import { type ModuleArea } from "@/lib/module-catalogue";

const GROUP_ORDER = ["Academics", "Finance", "Operations", "People", "Communication", "Settings"];

const AREA_ORDER: ModuleArea[] = ["transaction", "setup", "report"];
const AREA_TITLES: Record<ModuleArea, string> = {
  transaction: "Daily operations",
  setup: "Configuration",
  report: "Insights & reports",
};

export function AppSidebar() {
  const { modules, school, roleLabel } = useWorkspace();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const groups = GROUP_ORDER.map((group) => ({
    group,
    items: modules.filter((m) => m.navGroup === group),
  })).filter((g) => g.items.length > 0);

  const activeModule =
    modules.find(
      (m) =>
        pathname === m.route ||
        pathname.startsWith(`${m.route}/`) ||
        pathname.startsWith(`/m/${m.key}/`),
    ) ?? null;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 px-1 py-1.5">
          <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-sidebar-primary">
            {school?.logo_url ? (
              <img
                src={school.logo_url}
                alt={school?.name ?? "School logo"}
                className="size-full object-cover"
              />
            ) : (
              <span className="font-display text-base font-bold text-sidebar-primary-foreground">
                {school?.code?.slice(0, 2).toUpperCase() ?? "CS"}
              </span>
            )}
          </div>
          <div className="grid min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="truncate font-display text-sm font-semibold text-sidebar-accent-foreground">
              {school?.name ?? "Cyber School"}
            </span>
            <span className="truncate text-xs text-sidebar-foreground/70">{roleLabel}</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {activeModule ? (
          <>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="All modules">
                      <Link to="/dashboard">
                        <ArrowLeft />
                        <span>All modules</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    {(() => {
                      const Icon = iconFor(activeModule.icon);
                      return (
                        <SidebarMenuButton
                          asChild
                          isActive={pathname === activeModule.route}
                          tooltip={activeModule.name}
                          className={pathname === activeModule.route ? "nav-glow" : undefined}
                        >
                          <Link to={activeModule.route as "/dashboard"}>
                            <Icon />
                            <span>{activeModule.name} overview</span>
                          </Link>
                        </SidebarMenuButton>
                      );
                    })()}
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {AREA_ORDER.map((area) => {
              const pages = activeModule.pages.filter((p) => p.area === area);
              if (pages.length === 0) return null;
              const hasActivePage = pages.some(
                (p) => pathname === `/m/${activeModule.key}/${p.pageKey}`,
              );
              return (
                <Collapsible key={area} defaultOpen={hasActivePage}>
                  <SidebarGroup className="p-0">
                    <SidebarGroupLabel asChild>
                      <CollapsibleTrigger className="group/label flex w-full cursor-pointer items-center justify-between px-2 py-1.5 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                        <span>{AREA_TITLES[area]}</span>
                        <ChevronRight className="size-4 shrink-0 text-sidebar-foreground/70 transition-transform duration-200 group-data-[state=open]/label:rotate-90" />
                      </CollapsibleTrigger>
                    </SidebarGroupLabel>
                    <CollapsibleContent>
                      <SidebarGroupContent className="px-2 pb-1">
                        <SidebarMenu>
                          {pages.map((p) => {
                            const active = pathname === `/m/${activeModule.key}/${p.pageKey}`;
                            return (
                              <SidebarMenuItem key={p.pageKey}>
                                <SidebarMenuButton
                                  asChild
                                  isActive={active}
                                  tooltip={p.label}
                                  className={active ? "nav-glow" : undefined}
                                >
                                  <Link
                                    to="/m/$module/$page"
                                    params={{ module: activeModule.key, page: p.pageKey }}
                                  >
                                    <span className="size-1.5 shrink-0 rounded-full bg-sidebar-foreground/40" />
                                    <span className="truncate">{p.label}</span>
                                  </Link>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            );
                          })}
                        </SidebarMenu>
                      </SidebarGroupContent>
                    </CollapsibleContent>
                  </SidebarGroup>
                </Collapsible>
              );
            })}
          </>
        ) : (
          <>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/dashboard"} tooltip="Dashboard">
                  <Link to="/dashboard">
                    <LayoutDashboard />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {groups.map(({ group, items }) => (
          <SidebarGroup key={group}>
            <SidebarGroupLabel>{group}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => {
                  const Icon = iconFor(item.icon);
                  const active = pathname === item.route || pathname.startsWith(`/m/${item.key}/`);

                  return (
                    <SidebarMenuItem key={item.key}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.name}
                        className={active ? "nav-glow" : undefined}
                      >
                        <Link to={item.route as "/dashboard"}>
                          <Icon />
                          <span>{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
          </>
        )}
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
