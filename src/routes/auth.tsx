import { createFileRoute, redirect } from "@tanstack/react-router";

import { SignInScreen } from "@/components/auth/sign-in-screen";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_SIGN_IN_CONTENT } from "@/lib/sign-in-content";

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
  return <SignInScreen content={DEFAULT_SIGN_IN_CONTENT} />;
}
