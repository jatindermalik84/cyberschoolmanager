import { createFileRoute } from "@tanstack/react-router";

import { ModuleDashboard } from "@/components/shell/module-dashboard";

const title = "Medical | Cyber School Manager";
const description = "Medical dashboard: setup, daily work and reports for your school in Cyber School Manager.";

export const Route = createFileRoute("/_authenticated/medical")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <ModuleDashboard moduleKey="medical" />,
});
