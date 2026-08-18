import { createFileRoute } from "@tanstack/react-router";

import { ModulePlaceholder } from "@/components/shell/module-placeholder";

export const Route = createFileRoute("/_authenticated/settings/sessions")({
  head: () => ({
    meta: [
      { title: "Academic Sessions | Cyber School Manager" },
      { name: "description", content: "Academic Sessions module in the Cyber School Manager school ERP workspace." },
      { property: "og:title", content: "Academic Sessions | Cyber School Manager" },
      { property: "og:description", content: "Academic Sessions module in the Cyber School Manager school ERP workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <ModulePlaceholder route="/settings/sessions" />,
});
