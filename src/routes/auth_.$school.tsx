import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { SignInScreen } from "@/components/auth/sign-in-screen";
import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_SIGN_IN_CONTENT,
  applyEvent,
  pickActiveEvent,
  rowToContent,
  SIGN_IN_EVENT_COLUMNS,
  type SignInEventRow,
  type SignInContent,
  type SignInPageRow,
} from "@/lib/sign-in-content";

export const Route = createFileRoute("/auth_/$school")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: "/dashboard" });
  },
  head: ({ params }) => {
    const title = `Sign in | ${params.school} | Cyber School Manager`;
    const description = "Sign in to your school workspace — one link for admins, teachers and students.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: SchoolAuthPage,
});

function SchoolAuthPage() {
  const { school } = Route.useParams();
  const [content, setContent] = useState<SignInContent | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data } = await supabase
        .from("sign_in_pages")
        .select(
          "school_id, slug, brand_name, logo_url, background_url, headline, description, highlights, banner_enabled, banner_text, banner_tone, overlay_tint, overlay_opacity, overlay_blur, background_brightness",
        )
        .eq("slug", school.toLowerCase())
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
      if (cancelled) return;
      setContent(applyEvent(base, pickActiveEvent((events ?? []) as SignInEventRow[])));
    })();
    return () => {
      cancelled = true;
    };
  }, [school]);

  if (!content) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <SignInScreen content={content} />;
}