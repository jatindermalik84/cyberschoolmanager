import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { GraduationCap, LayoutGrid, Search, UserCog } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import { AREA_LABELS } from "@/lib/module-catalogue";
import { useWorkspace } from "./workspace";

interface PageHit {
  id: string;
  label: string;
  hint: string;
  moduleKey: string;
  pageKey: string;
  route?: string | undefined;
}

export function GlobalSearch() {
  const { modules, school } = useWorkspace();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(term.trim()), 250);
    return () => clearTimeout(t);
  }, [term]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const allPages = useMemo<PageHit[]>(() => {
    const rows: PageHit[] = [];
    for (const m of modules) {
      rows.push({
        id: `mod:${m.key}`,
        label: `${m.name} dashboard`,
        hint: m.navGroup,
        moduleKey: m.key,
        pageKey: "",
        route: m.route,
      });
      for (const p of m.pages) {
        rows.push({
          id: `${m.key}:${p.pageKey}`,
          label: p.label,
          hint: `${m.name} · ${AREA_LABELS[p.area]}`,
          moduleKey: m.key,
          pageKey: p.pageKey,
          route: p.route,
        });
      }
    }
    return rows;
  }, [modules]);

  const pageHits = useMemo(() => {
    const q = debounced.toLowerCase();
    if (!q) return allPages.slice(0, 8);
    return allPages
      .filter((p) => p.label.toLowerCase().includes(q) || p.hint.toLowerCase().includes(q))
      .slice(0, 12);
  }, [allPages, debounced]);

  const { data: people, isFetching } = useQuery({
    queryKey: ["global-search", school?.id, debounced],
    enabled: open && debounced.length >= 2 && !!school?.id,
    queryFn: async () => {
      const like = `%${debounced}%`;
      const [students, staff] = await Promise.all([
        supabase
          .from("students")
          .select("id, full_name, admission_no, contact_phone, status, classes(name, section)")
          .eq("school_id", school!.id)
          .or(`full_name.ilike.${like},admission_no.ilike.${like},contact_phone.ilike.${like}`)
          .limit(8),
        supabase
          .from("staff")
          .select("id, full_name, employee_code, designation, department, status")
          .eq("school_id", school!.id)
          .or(`full_name.ilike.${like},employee_code.ilike.${like},contact_phone.ilike.${like}`)
          .limit(8),
      ]);
      return { students: students.data ?? [], staff: staff.data ?? [] };
    },
  });

  function go(to: string, params?: Record<string, string>) {
    setOpen(false);
    setTerm("");
    if (params) navigate({ to: "/m/$module/$page", params: params as { module: string; page: string } });
    else navigate({ to: to as "/dashboard" });
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="h-9 justify-start gap-2 px-3 text-muted-foreground md:w-[260px]"
        aria-label="Search students, staff and screens"
      >
        <Search className="size-4" />
        <span className="hidden text-sm md:inline">Search anything…</span>
        <kbd className="ml-auto hidden rounded border bg-muted px-1.5 py-0.5 text-[10px] md:inline">
          Ctrl K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search students, employees, screens…"
          value={term}
          onValueChange={setTerm}
        />
        <CommandList>
          <CommandEmpty>
            {isFetching ? "Searching…" : "No matches. Try a name, admission no. or screen name."}
          </CommandEmpty>

          {people?.students.length ? (
            <CommandGroup heading="Students">
              {people.students.map((s: any) => (
                <CommandItem
                  key={s.id}
                  value={`student ${s.full_name} ${s.admission_no}`}
                  onSelect={() => go("", { module: "students", page: "frmStudentUpdateNew" })}
                >
                  <GraduationCap className="size-4" />
                  <span className="truncate">{s.full_name}</span>
                  <span className="ml-auto truncate text-xs text-muted-foreground">
                    {s.admission_no}
                    {s.classes ? ` · ${s.classes.name}${s.classes.section ? `-${s.classes.section}` : ""}` : ""}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}

          {people?.staff.length ? (
            <CommandGroup heading="Employees">
              {people.staff.map((s: any) => (
                <CommandItem
                  key={s.id}
                  value={`staff ${s.full_name} ${s.employee_code}`}
                  onSelect={() => go("", { module: "hr", page: "frmEmployeeMaster" })}
                >
                  <UserCog className="size-4" />
                  <span className="truncate">{s.full_name}</span>
                  <span className="ml-auto truncate text-xs text-muted-foreground">
                    {s.employee_code}
                    {s.designation ? ` · ${s.designation}` : ""}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}

          {pageHits.length ? (
            <CommandGroup heading="Screens & modules">
              {pageHits.map((p) => (
                <CommandItem
                  key={p.id}
                  value={`page ${p.label} ${p.hint}`}
                  onSelect={() =>
                    p.route && !p.pageKey
                      ? go(p.route)
                      : p.route
                        ? go(p.route)
                        : go("", { module: p.moduleKey, page: p.pageKey })
                  }
                >
                  <LayoutGrid className="size-4" />
                  <span className="truncate">{p.label}</span>
                  <span className="ml-auto truncate text-xs text-muted-foreground">{p.hint}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
        </CommandList>
      </CommandDialog>
    </>
  );
}
