import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Copy, ExternalLink, Loader2, Megaphone, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWorkspace } from "@/components/shell/workspace";
import { SignInEventsCard } from "@/components/settings/sign-in-events";
import { SignInAuditLogCard } from "@/components/settings/sign-in-audit-log";
import { ImageUploadField } from "@/components/settings/image-upload-field";
import { supabase } from "@/integrations/supabase/client";
import { BANNER_TONES, bannerClasses } from "@/lib/sign-in-content";
import { diffFields, logSignInAudit } from "@/lib/sign-in-audit";

const title = "Sign-in page content | Cyber School Manager";
const description = "Customise the headline, highlights, logo, background and event banner shown on your school's sign-in link.";

export const Route = createFileRoute("/_authenticated/settings/sign-in-page")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SignInPageEditor,
});

interface FormState {
  slug: string;
  brand_name: string;
  logo_url: string;
  background_url: string;
  headline: string;
  description: string;
  highlights: string[];
  banner_enabled: boolean;
  banner_text: string;
  banner_tone: string;
  is_published: boolean;
}

function SignInPageEditor() {
  const { school } = useWorkspace();
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState<Record<string, unknown> | null>(null);
  const [auditToken, setAuditToken] = useState(0);

  useEffect(() => {
    if (!school) return;
    let cancelled = false;
    setLoading(true);
    void (async () => {
      const { data, error } = await supabase
        .from("sign_in_pages")
        .select("*")
        .eq("school_id", school.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) toast.error(error.message);
      setSavedSnapshot(
        data
          ? {
              slug: data.slug,
              brand_name: data.brand_name,
              logo_url: data.logo_url,
              background_url: data.background_url,
              headline: data.headline,
              description: data.description,
              highlights: data.highlights,
              banner_enabled: data.banner_enabled,
              banner_text: data.banner_text,
              banner_tone: data.banner_tone,
              is_published: data.is_published,
            }
          : null,
      );
      setForm({
        slug: data?.slug ?? school.code.toLowerCase(),
        brand_name: data?.brand_name ?? school.name,
        logo_url: data?.logo_url ?? school.logo_url ?? "",
        background_url: data?.background_url ?? "",
        headline: data?.headline ?? `Welcome back to ${school.name}.`,
        description: data?.description ?? "",
        highlights: data?.highlights ?? [],
        banner_enabled: data?.banner_enabled ?? false,
        banner_text: data?.banner_text ?? "",
        banner_tone: data?.banner_tone ?? "info",
        is_published: data?.is_published ?? true,
      });
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [school]);

  const signInUrl = useMemo(() => {
    if (typeof window === "undefined" || !form) return "";
    return `${window.location.origin}/auth/${form.slug}`;
  }, [form]);

  function patch(next: Partial<FormState>) {
    setForm((prev) => (prev ? { ...prev, ...next } : prev));
  }

  async function handleSave() {
    if (!school || !form) return;
    const slug = form.slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
    if (!slug) {
      toast.error("Enter a valid sign-in link name.");
      return;
    }
    setSaving(true);
    const payload = {
      slug,
      brand_name: form.brand_name.trim() || school.name,
      logo_url: form.logo_url.trim() || null,
      background_url: form.background_url.trim() || null,
      headline: form.headline.trim(),
      description: form.description.trim(),
      highlights: form.highlights.map((h) => h.trim()).filter(Boolean),
      banner_enabled: form.banner_enabled,
      banner_text: form.banner_text.trim() || null,
      banner_tone: form.banner_tone,
      is_published: form.is_published,
    };
    const { error } = await supabase
      .from("sign_in_pages")
      .upsert({ school_id: school.id, ...payload }, { onConflict: "school_id" });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    const changedFields = diffFields(savedSnapshot, payload);
    if (!savedSnapshot || changedFields.length > 0) {
      await logSignInAudit({
        schoolId: school.id,
        entity: "page",
        entityLabel: payload.brand_name,
        action: savedSnapshot ? "updated" : "created",
        changedFields,
      });
      setAuditToken((n) => n + 1);
    }
    setSavedSnapshot(payload);
    patch({ slug });
    toast.success("Sign-in page updated.");
  }

  if (!school || loading || !form) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Settings · Setup</p>
        <h1 className="font-display text-2xl font-semibold">Sign-in page content</h1>
        <p className="text-sm text-muted-foreground">
          Update what parents, students and staff see on your school's sign-in link — including a
          temporary event banner.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your sign-in link</CardTitle>
              <CardDescription>Share this link with your school community.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="slug">Link name</Label>
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={(e) => patch({ slug: e.target.value })}
                  placeholder="gurukul"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2 rounded-md bg-muted px-3 py-2 text-xs">
                <code className="truncate font-mono">{signInUrl}</code>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    void navigator.clipboard.writeText(signInUrl);
                    toast.success("Link copied.");
                  }}
                >
                  <Copy /> Copy
                </Button>
                <Button type="button" size="sm" variant="ghost" asChild>
                  <a href={signInUrl} target="_blank" rel="noreferrer">
                    <ExternalLink /> Open
                  </a>
                </Button>
              </div>
              <div className="flex items-center justify-between rounded-md border border-border/70 px-3 py-2">
                <div>
                  <p className="text-sm font-medium">Published</p>
                  <p className="text-xs text-muted-foreground">
                    When off, visitors see the standard Cyber School Manager sign-in screen.
                  </p>
                </div>
                <Switch
                  checked={form.is_published}
                  onCheckedChange={(v) => patch({ is_published: v })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Branding</CardTitle>
              <CardDescription>Logo and background shown on the left panel.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="brand">School name</Label>
                <Input id="brand" value={form.brand_name} onChange={(e) => patch({ brand_name: e.target.value })} />
              </div>
              <ImageUploadField
                id="logo"
                label="Logo image"
                schoolId={school.id}
                folder="logo"
                value={form.logo_url}
                onChange={(url) => patch({ logo_url: url })}
                defaultAspect="1"
                hint="PNG or SVG with transparent background works best. Crop to a square for best fit. Max 5 MB."
              />
              <ImageUploadField
                id="bg"
                label="Background image"
                schoolId={school.id}
                folder="background"
                value={form.background_url}
                onChange={(url) => patch({ background_url: url })}
                defaultAspect="16-9"
                hint="Wide photo, at least 1600px across. Max 5 MB."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Message</CardTitle>
              <CardDescription>Headline, supporting text and highlight points.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="headline">Headline</Label>
                <Input id="headline" value={form.headline} onChange={(e) => patch({ headline: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="desc">Description</Label>
                <Textarea id="desc" rows={3} value={form.description} onChange={(e) => patch({ description: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Highlight points</Label>
                {form.highlights.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={item}
                      onChange={(e) =>
                        patch({
                          highlights: form.highlights.map((h, i) => (i === index ? e.target.value : h)),
                        })
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Remove highlight"
                      onClick={() => patch({ highlights: form.highlights.filter((_, i) => i !== index) })}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => patch({ highlights: [...form.highlights, ""] })}
                >
                  <Plus /> Add point
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Event banner</CardTitle>
              <CardDescription>Show a temporary notice — admissions, results, holidays.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-md border border-border/70 px-3 py-2">
                <p className="text-sm font-medium">Show banner</p>
                <Switch checked={form.banner_enabled} onCheckedChange={(v) => patch({ banner_enabled: v })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="banner">Banner text</Label>
                <Textarea id="banner" rows={2} value={form.banner_text} onChange={(e) => patch({ banner_text: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Banner style</Label>
                <Select value={form.banner_tone} onValueChange={(v) => patch({ banner_tone: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BANNER_TONES.map((tone) => (
                      <SelectItem key={tone.value} value={tone.value}>
                        {tone.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="animate-spin" /> : <Save />} Save changes
          </Button>

          <SignInEventsCard schoolId={school.id} onLogged={() => setAuditToken((n) => n + 1)} />

          <SignInAuditLogCard schoolId={school.id} refreshToken={auditToken} />
        </div>

        <div className="xl:sticky xl:top-6 xl:h-fit">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Live preview</p>
          <div className="overflow-hidden rounded-xl border border-border/70 bg-sidebar p-6 text-sidebar-foreground">
            <div className="relative space-y-5">
              <div className="flex items-center gap-2.5">
                {form.logo_url ? (
                  <img src={form.logo_url} alt="" className="size-10 rounded-md bg-white/90 object-contain p-1" />
                ) : null}
                <span className="font-display text-base font-semibold text-sidebar-accent-foreground">
                  {form.brand_name}
                </span>
              </div>
              {form.banner_enabled && form.banner_text ? (
                <div className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${bannerClasses(form.banner_tone)}`}>
                  <Megaphone className="mt-0.5 size-3.5 shrink-0" />
                  <span>{form.banner_text}</span>
                </div>
              ) : null}
              <h2 className="font-display text-2xl font-semibold leading-tight text-sidebar-accent-foreground">
                {form.headline}
              </h2>
              {form.description ? (
                <p className="text-sm leading-relaxed text-sidebar-foreground/80">{form.description}</p>
              ) : null}
              <ul className="grid gap-2 text-sm text-sidebar-foreground/80">
                {form.highlights.filter(Boolean).map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-sidebar-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}