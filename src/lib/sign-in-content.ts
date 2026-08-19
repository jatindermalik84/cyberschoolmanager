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