import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, User } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "./workspace";


export function TopBar() {
  const { schools, school, setSchoolId, sessions, session, setSessionId, profile, roleLabel } =
    useWorkspace();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const initials = (profile?.full_name ?? "User")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-card/85 px-3 backdrop-blur md:px-5">
      <SidebarTrigger />
      <Separator orientation="vertical" className="mr-1 h-5" />

      <Link to="/dashboard" className="hidden shrink-0 items-center gap-2 sm:flex">
        <img
          src={csmLogo.url}
          alt="Cyber School Manager logo"
          className="h-7 w-auto"
          loading="lazy"
        />
        <span className="hidden font-display text-sm font-semibold text-foreground lg:inline">
          Cyber School Manager
        </span>
      </Link>
      <Separator orientation="vertical" className="hidden h-5 sm:flex" />

      <Select value={school?.id ?? ""} onValueChange={setSchoolId}>

        <SelectTrigger className="h-9 w-[150px] md:w-[230px]" aria-label="Select school">
          <SelectValue placeholder="Select school" />
        </SelectTrigger>
        <SelectContent>
          {schools.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={session?.id ?? ""} onValueChange={setSessionId}>
        <SelectTrigger className="hidden h-9 w-[140px] sm:flex" aria-label="Select academic session">
          <SelectValue placeholder="Session" />
        </SelectTrigger>
        <SelectContent>
          {sessions.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="ml-auto flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full" aria-label="Account menu">
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="grid gap-0.5">
              <span className="truncate text-sm">{profile?.full_name ?? "User"}</span>
              <span className="text-xs font-normal text-muted-foreground">{roleLabel}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <User /> Profile (coming soon)
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleSignOut}>
              <LogOut /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
