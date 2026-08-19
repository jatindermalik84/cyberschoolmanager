CREATE TABLE public.sign_in_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL UNIQUE REFERENCES public.schools(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  brand_name text NOT NULL,
  logo_url text,
  background_url text,
  headline text NOT NULL DEFAULT 'One workspace for the whole school.',
  description text NOT NULL DEFAULT '',
  highlights text[] NOT NULL DEFAULT '{}'::text[],
  banner_enabled boolean NOT NULL DEFAULT false,
  banner_text text,
  banner_tone text NOT NULL DEFAULT 'info',
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.sign_in_pages TO anon;
GRANT SELECT, INSERT, UPDATE ON public.sign_in_pages TO authenticated;
GRANT ALL ON public.sign_in_pages TO service_role;

ALTER TABLE public.sign_in_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published sign-in pages"
ON public.sign_in_pages FOR SELECT TO anon, authenticated
USING (is_published = true);

CREATE POLICY "Members can view their school sign-in page"
ON public.sign_in_pages FOR SELECT TO authenticated
USING (public.is_member_of_school(auth.uid(), school_id));

CREATE POLICY "School admins can create their sign-in page"
ON public.sign_in_pages FOR INSERT TO authenticated
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR public.has_role(auth.uid(), school_id, 'school_admin')
  OR public.has_role(auth.uid(), school_id, 'school_owner')
);

CREATE POLICY "School admins can update their sign-in page"
ON public.sign_in_pages FOR UPDATE TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR public.has_role(auth.uid(), school_id, 'school_admin')
  OR public.has_role(auth.uid(), school_id, 'school_owner')
)
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR public.has_role(auth.uid(), school_id, 'school_admin')
  OR public.has_role(auth.uid(), school_id, 'school_owner')
);

CREATE TRIGGER update_sign_in_pages_updated_at
BEFORE UPDATE ON public.sign_in_pages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.sign_in_pages (school_id, slug, brand_name, logo_url, headline, description, highlights, banner_enabled, banner_text, banner_tone)
SELECT s.id, lower(s.code), s.name, s.logo_url,
  'Welcome back to ' || s.name || '.',
  'Admissions, attendance, examinations, fees, transport, library, hostel, payroll and communication — all under a single sign-in, whichever role you hold.',
  ARRAY['Same link for admins, teachers and students','Secure, role-based access to your school data','Self-service password reset'],
  true,
  'Admissions for the new session are now open. Contact the school office for details.',
  'info'
FROM public.schools s;