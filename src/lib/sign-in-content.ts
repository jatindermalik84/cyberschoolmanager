export interface SignInContent {
  slug: string;
  brandName: string;
  logoUrl: string | null;
  backgroundUrl: string | null;
  headline: string;
  description: string;
  highlights: string[];
  bannerEnabled: boolean;
  bannerText: string | null;
  bannerTone: string;
  overlayTint: OverlayTint;
  overlayOpacity: number;
  overlayBlur: number;
  backgroundBrightness: number;
}

export type OverlayTint = "none" | "dark" | "light" | "brand";

export const OVERLAY_TINTS = [
  { value: "none", label: "No tint" },
  { value: "dark", label: "Darken" },
  { value: "light", label: "Lighten" },
  { value: "brand", label: "Brand colour" },
] as const;

export const DEFAULT_OVERLAY = {
  overlayTint: "dark" as OverlayTint,
  overlayOpacity: 70,
  overlayBlur: 0,
  backgroundBrightness: 100,
};

function clamp(value: number, min: number, max: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

/** Inline styles for the background image and its readability overlay. */
export function overlayStyles(content: Pick<SignInContent, "overlayTint" | "overlayOpacity" | "overlayBlur" | "backgroundBrightness">) {
  const opacity = clamp(content.overlayOpacity, 0, 100, 70) / 100;
  const blur = clamp(content.overlayBlur, 0, 24, 0);
  const brightness = clamp(content.backgroundBrightness, 20, 150, 100) / 100;
  const tintColor =
    content.overlayTint === "light"
      ? "255 255 255"
      : content.overlayTint === "brand"
        ? "var(--sidebar-primary-rgb, 30 41 90)"
        : "10 14 24";
  return {
    image: {
      filter: `brightness(${brightness})${blur > 0 ? ` blur(${blur}px)` : ""}`,
      transform: blur > 0 ? `scale(${1 + blur / 100})` : undefined,
    } as React.CSSProperties,
    tint:
      content.overlayTint === "none"
        ? null
        : ({ backgroundColor: `rgb(${tintColor} / ${opacity})` } as React.CSSProperties),
  };
}

export const DEFAULT_SIGN_IN_CONTENT: SignInContent = {
  slug: "",
  brandName: "Cyber School Manager",
  logoUrl: null,
  backgroundUrl: null,
  headline: "One workspace for the whole school.",
  description:
    "Admissions, attendance, examinations, fees, transport, library, hostel, payroll and communication — all under a single sign-in, whichever role you hold.",
  highlights: [
    "Same link for admins, teachers and students",
    "Multi-school tenancy with strict data isolation",
    "Self-service password reset",
  ],
  bannerEnabled: false,
  bannerText: null,
  bannerTone: "info",
  ...DEFAULT_OVERLAY,
};

export const BANNER_TONES = [
  { value: "info", label: "Information" },
  { value: "success", label: "Celebration" },
  { value: "warning", label: "Attention" },
] as const;

export interface SignInPageRow {
  slug: string;
  brand_name: string;
  logo_url: string | null;
  background_url: string | null;
  headline: string;
  description: string;
  highlights: string[];
  banner_enabled: boolean;
  banner_text: string | null;
  banner_tone: string;
  overlay_tint?: string | null;
  overlay_opacity?: number | null;
  overlay_blur?: number | null;
  background_brightness?: number | null;
}

export function rowToContent(row: SignInPageRow): SignInContent {
  return {
    slug: row.slug,
    brandName: row.brand_name,
    logoUrl: row.logo_url,
    backgroundUrl: row.background_url,
    headline: row.headline,
    description: row.description,
    highlights: row.highlights ?? [],
    bannerEnabled: row.banner_enabled,
    bannerText: row.banner_text,
    bannerTone: row.banner_tone,
    overlayTint: (row.overlay_tint as OverlayTint | null) ?? DEFAULT_OVERLAY.overlayTint,
    overlayOpacity: row.overlay_opacity ?? DEFAULT_OVERLAY.overlayOpacity,
    overlayBlur: row.overlay_blur ?? DEFAULT_OVERLAY.overlayBlur,
    backgroundBrightness: row.background_brightness ?? DEFAULT_OVERLAY.backgroundBrightness,
  };
}

export function bannerClasses(tone: string) {
  switch (tone) {
    case "success":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-100";
    case "warning":
      return "border-amber-500/40 bg-amber-500/10 text-amber-100";
    default:
      return "border-sidebar-primary/40 bg-sidebar-primary/10 text-sidebar-accent-foreground";
  }
}
export interface SignInEventRow {
  id: string;
  name: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  priority: number;
  headline: string | null;
  description: string | null;
  highlights: string[] | null;
  banner_enabled: boolean;
  banner_text: string | null;
  banner_tone: string;
  background_url: string | null;
  overlay_tint: string | null;
  overlay_opacity: number | null;
  overlay_blur: number | null;
  background_brightness: number | null;
}

export const SIGN_IN_EVENT_COLUMNS =
  "id, name, starts_at, ends_at, is_active, priority, headline, description, highlights, banner_enabled, banner_text, banner_tone, background_url, overlay_tint, overlay_opacity, overlay_blur, background_brightness";

export function isEventRunning(event: Pick<SignInEventRow, "starts_at" | "ends_at" | "is_active">, at: Date = new Date()) {
  const now = at.getTime();
  return event.is_active && now >= Date.parse(event.starts_at) && now < Date.parse(event.ends_at);
}

/** Picks the highest-priority (then latest-starting) event that is live right now. */
export function pickActiveEvent(events: SignInEventRow[], at: Date = new Date()): SignInEventRow | null {
  const running = events.filter((event) => isEventRunning(event, at));
  if (running.length === 0) return null;
  return running.sort(
    (a, b) => b.priority - a.priority || Date.parse(b.starts_at) - Date.parse(a.starts_at),
  )[0]!;
}

/** Overlays a scheduled event's content on top of the school's base sign-in content. */
export function applyEvent(base: SignInContent, event: SignInEventRow | null): SignInContent {
  if (!event) return base;
  return {
    ...base,
    headline: event.headline?.trim() ? event.headline : base.headline,
    description: event.description?.trim() ? event.description : base.description,
    highlights: event.highlights && event.highlights.length > 0 ? event.highlights : base.highlights,
    backgroundUrl: event.background_url?.trim() ? event.background_url : base.backgroundUrl,
    bannerEnabled: event.banner_enabled && Boolean(event.banner_text?.trim()),
    bannerText: event.banner_text ?? base.bannerText,
    bannerTone: event.banner_tone,
    overlayTint: (event.overlay_tint as OverlayTint | null) ?? base.overlayTint,
    overlayOpacity: event.overlay_opacity ?? base.overlayOpacity,
    overlayBlur: event.overlay_blur ?? base.overlayBlur,
    backgroundBrightness: event.background_brightness ?? base.backgroundBrightness,
  };
}
