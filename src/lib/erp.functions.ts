import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getWorkspace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [profileRes, rolesRes, schoolsRes, sessionsRes, modulesRes] = await Promise.all([
      supabase.from("profiles").select("id, full_name, phone, avatar_url").eq("id", userId).maybeSingle(),
      supabase.from("user_school_roles").select("school_id, role").eq("user_id", userId),
      supabase.from("schools").select("id, name, code, city, board, logo_url, status").order("name"),
      supabase
        .from("academic_sessions")
        .select("id, school_id, label, start_date, end_date, is_current")
        .order("start_date", { ascending: false }),
      supabase
        .from("modules")
        .select("key, name, description, icon, route, nav_group, sort_order, allowed_roles")
        .eq("is_active", true)
        .order("sort_order"),
    ]);

    return {
      profile: profileRes.data ?? null,
      roles: rolesRes.data ?? [],
      schools: schoolsRes.data ?? [],
      sessions: sessionsRes.data ?? [],
      modules: modulesRes.data ?? [],
    };
  });

export const getDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { schoolId: string }) => {
    if (!input || typeof input.schoolId !== "string") throw new Error("schoolId is required");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { schoolId } = data;

    const [students, staff, classes, fees, attendance, activity] = await Promise.all([
      supabase.from("students").select("id", { count: "exact", head: true }).eq("school_id", schoolId).eq("status", "active"),
      supabase.from("staff").select("id", { count: "exact", head: true }).eq("school_id", schoolId).eq("status", "active"),
      supabase.from("classes").select("name, section, strength").eq("school_id", schoolId).order("sort_order"),
      supabase
        .from("fee_collection_summary")
        .select("month_start, collected_amount, demand_amount, defaulter_count")
        .eq("school_id", schoolId)
        .order("month_start"),
      supabase
        .from("attendance_summary")
        .select("attendance_date, present_count, absent_count, total_count")
        .eq("school_id", schoolId)
        .order("attendance_date", { ascending: false })
        .limit(5),
      supabase
        .from("activity_log")
        .select("id, actor_name, action, entity, occurred_at")
        .eq("school_id", schoolId)
        .order("occurred_at", { ascending: false })
        .limit(6),
    ]);

    return {
      studentCount: students.count ?? 0,
      staffCount: staff.count ?? 0,
      classes: classes.data ?? [],
      fees: fees.data ?? [],
      attendance: attendance.data ?? [],
      activity: activity.data ?? [],
    };
  });
