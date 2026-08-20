CREATE TABLE public.dashboard_widget_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  module_key text NOT NULL,
  widget_id text NOT NULL,
  label text,
  answers text,
  reconcile text,
  note text,
  hidden boolean NOT NULL DEFAULT false,
  sort_order integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, module_key, widget_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dashboard_widget_overrides TO authenticated;
GRANT ALL ON public.dashboard_widget_overrides TO service_role;

ALTER TABLE public.dashboard_widget_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School members can view widget settings"
  ON public.dashboard_widget_overrides FOR SELECT TO authenticated
  USING (public.is_member_of_school(auth.uid(), school_id));

CREATE POLICY "School admins can manage widget settings"
  ON public.dashboard_widget_overrides FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), school_id, 'school_owner')
    OR public.has_role(auth.uid(), school_id, 'school_admin')
    OR public.has_role(auth.uid(), school_id, 'principal')
    OR public.is_super_admin(auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(), school_id, 'school_owner')
    OR public.has_role(auth.uid(), school_id, 'school_admin')
    OR public.has_role(auth.uid(), school_id, 'principal')
    OR public.is_super_admin(auth.uid())
  );

CREATE TRIGGER update_dashboard_widget_overrides_updated_at
  BEFORE UPDATE ON public.dashboard_widget_overrides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();