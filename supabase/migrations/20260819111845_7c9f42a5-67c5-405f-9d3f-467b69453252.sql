CREATE TABLE public.sign_in_page_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  priority integer NOT NULL DEFAULT 0,
  headline text,
  description text,
  highlights text[],
  banner_enabled boolean NOT NULL DEFAULT true,
  banner_text text,
  banner_tone text NOT NULL DEFAULT 'info',
  background_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX sign_in_page_events_school_window_idx
  ON public.sign_in_page_events (school_id, starts_at, ends_at);

CREATE OR REPLACE FUNCTION public.sign_in_page_events_validate()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
begin
  if new.ends_at <= new.starts_at then
    raise exception 'Event end must be after the start';
  end if;
  return new;
end;
$$;

CREATE TRIGGER sign_in_page_events_validate_trg
  BEFORE INSERT OR UPDATE ON public.sign_in_page_events
  FOR EACH ROW EXECUTE FUNCTION public.sign_in_page_events_validate();

CREATE TRIGGER update_sign_in_page_events_updated_at
  BEFORE UPDATE ON public.sign_in_page_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

GRANT SELECT ON public.sign_in_page_events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sign_in_page_events TO authenticated;
GRANT ALL ON public.sign_in_page_events TO service_role;

ALTER TABLE public.sign_in_page_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view running events of published pages"
  ON public.sign_in_page_events FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    AND now() >= starts_at
    AND now() < ends_at
    AND EXISTS (
      SELECT 1 FROM public.sign_in_pages p
      WHERE p.school_id = sign_in_page_events.school_id AND p.is_published = true
    )
  );

CREATE POLICY "Members can view their school events"
  ON public.sign_in_page_events FOR SELECT
  TO authenticated
  USING (public.is_member_of_school(auth.uid(), school_id));

CREATE POLICY "School admins can create events"
  ON public.sign_in_page_events FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_super_admin(auth.uid())
    OR public.has_role(auth.uid(), school_id, 'school_admin'::public.app_role)
    OR public.has_role(auth.uid(), school_id, 'school_owner'::public.app_role)
  );

CREATE POLICY "School admins can update events"
  ON public.sign_in_page_events FOR UPDATE
  TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR public.has_role(auth.uid(), school_id, 'school_admin'::public.app_role)
    OR public.has_role(auth.uid(), school_id, 'school_owner'::public.app_role)
  )
  WITH CHECK (
    public.is_super_admin(auth.uid())
    OR public.has_role(auth.uid(), school_id, 'school_admin'::public.app_role)
    OR public.has_role(auth.uid(), school_id, 'school_owner'::public.app_role)
  );

CREATE POLICY "School admins can delete events"
  ON public.sign_in_page_events FOR DELETE
  TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR public.has_role(auth.uid(), school_id, 'school_admin'::public.app_role)
    OR public.has_role(auth.uid(), school_id, 'school_owner'::public.app_role)
  );