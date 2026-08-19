import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { SignInScreen } from "@/components/auth/sign-in-screen";
import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_SIGN_IN_CONTENT,
  SIGN_IN_EVENT_COLUMNS,
  applyEvent,
  pickActiveEvent,
  rowToContent,
  type SignInContent,
  type SignInEventRow,
  type SignInPageRow,
} from "@/lib/sign-in-content";

export const Route = createFileRoute("/auth")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "Sign in | Cyber School Manager" },
      {
        name: "description",
        content:
          "One sign-in for school admins, teachers, accountants and students. Access your school workspace securely.",
      },
      { property: "og:title", content: "Sign in | Cyber School Manager" },
      { property: "og:description", content: "One sign-in for every role in your school." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [content, setContent] = useState<SignInContent | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data } = await supabase
        .from("sign_in_pages")
        .select(
          "school_id, slug, brand_name, logo_url, background_url, headline, description, highlights, banner_enabled, banner_text, banner_tone, overlay_tint, overlay_opacity, overlay_blur, background_brightness",
        )
        .eq("is_published", true)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelled) return;
      if (!data) {
        setContent(DEFAULT_SIGN_IN_CONTENT);
        return;
      }

      const base = rowToContent(data as SignInPageRow);
      const { data: events } = await supabase
        .from("sign_in_page_events")
        .select(SIGN_IN_EVENT_COLUMNS)
        .eq("school_id", (data as { school_id: string }).school_id);

      if (!cancelled) {
        setContent(applyEvent(base, pickActiveEvent((events ?? []) as SignInEventRow[])));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!content) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <SignInScreen content={content} />;
}
