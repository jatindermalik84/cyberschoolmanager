import { createFileRoute } from "@tanstack/react-router";

import { ModulePlaceholder } from "@/components/shell/module-placeholder";

export const Route = createFileRoute("/_authenticated/fee")({
  head: () => ({
    meta: [
      { title: "Fee | Cyber School Manager" },
      { name: "description", content: "Fee module in the Cyber School Manager school ERP workspace." },
      { property: "og:title", content: "Fee | Cyber School Manager" },
      { property: "og:description", content: "Fee module in the Cyber School Manager school ERP workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <ModulePlaceholder route="/fee" />,
});
