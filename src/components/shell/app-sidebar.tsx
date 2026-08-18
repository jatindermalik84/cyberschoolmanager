import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard } from "lucide-react";

import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { iconFor } from "./icon-map";
import { useWorkspace } from "./workspace";


const GROUP_ORDER = ["Academics", "Finance", "Operations", "People", "Communication", "Settings"];

export function AppSidebar() {
  const { modules, school, roleLabel } = useWorkspace();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const groups = GROUP_ORDER.map((group) => ({
    group,
    items: modules.filter((m) => m.nav_group === group),
  })).filter((g) => g.items.length > 0);

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
                  const Icon = iconFor(item.icon ?? "");
                  return (
                    <SidebarMenuItem key={item.key}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.route}
                        tooltip={item.name}
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
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}

