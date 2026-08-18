import { createFileRoute, redirect } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    throw redirect({ to: data.user ? "/dashboard" : "/auth" });
  },
  head: () => ({
    meta: [
      { title: "Cyber School Manager — School ERP workspace" },
      {
        name: "description",
        content:
          "Multi-tenant school ERP covering admissions, attendance, examinations, fees, transport, library and payroll under one sign-in.",
      },
      { property: "og:title", content: "Cyber School Manager — School ERP workspace" },
      {
        property: "og:description",
        content: "Admissions, attendance, fees, transport and payroll in one school workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => null,
});
