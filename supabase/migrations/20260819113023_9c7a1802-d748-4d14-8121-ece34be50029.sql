CREATE TABLE public.sign_in_page_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name text NOT NULL DEFAULT 'Unknown user',
  entity text NOT NULL CHECK (entity IN ('page','event')),
  entity_id uuid,
  entity_label text,
  action text NOT NULL CHECK (action IN ('created','updated','deleted')),
  changed_fields text[] NOT NULL DEFAULT '{}'::text[],
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX sign_in_page_audit_log_school_created_idx
  ON public.sign_in_page_audit_log (school_id, created_at DESC);

GRANT SELECT, INSERT ON public.sign_in_page_audit_log TO authenticated;
GRANT ALL ON public.sign_in_page_audit_log TO service_role;

ALTER TABLE public.sign_in_page_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their school audit log"
  ON public.sign_in_page_audit_log FOR SELECT TO authenticated
  USING (public.is_member_of_school(auth.uid(), school_id));

CREATE POLICY "School admins can add audit entries"
  ON public.sign_in_page_audit_log FOR INSERT TO authenticated
  WITH CHECK (
    actor_id = auth.uid() AND (
      public.is_super_admin(auth.uid())
      OR public.has_role(auth.uid(), school_id, 'school_admin'::public.app_role)
      OR public.has_role(auth.uid(), school_id, 'school_owner'::public.app_role)
    )
  );