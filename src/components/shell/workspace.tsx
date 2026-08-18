import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";

import { getWorkspace } from "@/lib/erp.functions";
import { MODULE_CATALOGUE, type ModuleDef } from "@/lib/module-catalogue";

export const workspaceQueryOptions = queryOptions({
  queryKey: ["workspace"],
  queryFn: () => getWorkspace(),
});

type Workspace = Awaited<ReturnType<typeof getWorkspace>>;
type School = Workspace["schools"][number];
type Session = Workspace["sessions"][number];

interface WorkspaceValue {
  profile: Workspace["profile"];
  schools: School[];
  school: School | null;
  setSchoolId: (id: string) => void;
  sessions: Session[];
  session: Session | null;
  setSessionId: (id: string) => void;
  modules: ModuleDef[];
  roles: string[];
  roleLabel: string;
}

const WorkspaceContext = createContext<WorkspaceValue | null>(null);

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  school_owner: "School Owner",
  school_admin: "School Admin",
  principal: "Principal",
  teacher: "Teacher",
  accountant: "Accountant",
  librarian: "Librarian",
  transport_staff: "Transport",
  hostel_staff: "Hostel",
  staff: "Staff",
  parent: "Parent",
  student: "Student",
};

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { data } = useSuspenseQuery(workspaceQueryOptions);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const value = useMemo<WorkspaceValue>(() => {
    const school = data.schools.find((s) => s.id === schoolId) ?? data.schools[0] ?? null;
    const sessions = data.sessions.filter((s) => s.school_id === school?.id);
    const session =
      sessions.find((s) => s.id === sessionId) ?? sessions.find((s) => s.is_current) ?? sessions[0] ?? null;
    const roles = data.roles
      .filter((r) => !school || r.school_id === school.id || r.role === "super_admin")
      .map((r) => r.role as string);
    const modules = MODULE_CATALOGUE.filter((m) =>
      roles.some((role) => m.allowedRoles.includes(role)),
    ).sort((a, b) => a.sortOrder - b.sortOrder);

    return {
      profile: data.profile,
      schools: data.schools,
      school,
      setSchoolId,
      sessions,
      session,
      setSessionId,
      modules,
      roles,
      roleLabel: roles.length ? (ROLE_LABELS[roles[0]!] ?? roles[0]!) : "No role assigned",
    };
  }, [data, schoolId, sessionId]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return ctx;
}
