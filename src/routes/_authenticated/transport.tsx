import { createFileRoute } from "@tanstack/react-router";

import { ModulePlaceholder } from "@/components/shell/module-placeholder";

export const Route = createFileRoute("/_authenticated/transport")({
  head: () => ({
    meta: [
      { title: "Transport | Cyber School Manager" },
      { name: "description", content: "Transport module in the Cyber School Manager school ERP workspace." },
      { property: "og:title", content: "Transport | Cyber School Manager" },
      { property: "og:description", content: "Transport module in the Cyber School Manager school ERP workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <ModulePlaceholder route="/transport" />,
});
