ALTER TABLE public.sign_in_pages
  ADD COLUMN IF NOT EXISTS overlay_tint text NOT NULL DEFAULT 'dark',
  ADD COLUMN IF NOT EXISTS overlay_opacity integer NOT NULL DEFAULT 70,
  ADD COLUMN IF NOT EXISTS overlay_blur integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS background_brightness integer NOT NULL DEFAULT 100;

ALTER TABLE public.sign_in_page_events
  ADD COLUMN IF NOT EXISTS overlay_tint text,
  ADD COLUMN IF NOT EXISTS overlay_opacity integer,
  ADD COLUMN IF NOT EXISTS overlay_blur integer,
  ADD COLUMN IF NOT EXISTS background_brightness integer;

ALTER TABLE public.sign_in_pages
  ADD CONSTRAINT sign_in_pages_overlay_ranges CHECK (
    overlay_opacity BETWEEN 0 AND 100
    AND overlay_blur BETWEEN 0 AND 24
    AND background_brightness BETWEEN 20 AND 150
    AND overlay_tint IN ('none','dark','light','brand')
  );

ALTER TABLE public.sign_in_page_events
  ADD CONSTRAINT sign_in_page_events_overlay_ranges CHECK (
    (overlay_opacity IS NULL OR overlay_opacity BETWEEN 0 AND 100)
    AND (overlay_blur IS NULL OR overlay_blur BETWEEN 0 AND 24)
    AND (background_brightness IS NULL OR background_brightness BETWEEN 20 AND 150)
    AND (overlay_tint IS NULL OR overlay_tint IN ('none','dark','light','brand'))
  );