import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard } from "lucide-react";

import cybrainLogo from "@/assets/cybrain-logo.jpg.asset.json";

import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
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
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-sidebar-primary font-display text-base font-bold text-sidebar-primary-foreground">
            {school?.code?.slice(0, 2).toUpperCase() ?? "CS"}
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

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="px-2 py-1 group-data-[collapsible=icon]:hidden">
          <img
            src={cybrainLogo.url}
            alt="Cybrain Software Solutions logo"
            className="h-5 w-auto rounded-sm bg-background/95 px-1 py-0.5"
            loading="lazy"
          />
          <p className="mt-2 text-[11px] leading-tight text-sidebar-foreground/60">
            &copy; {new Date().getFullYear()} Cybrain Software Solutions&reg;. All rights reserved.
          </p>
          <p className="mt-1 text-[11px] leading-tight text-sidebar-foreground/45">
            Prototype build — modules ship in later phases.
          </p>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
