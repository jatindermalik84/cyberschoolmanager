import { createFileRoute } from "@tanstack/react-router";

import { ModulePlaceholder } from "@/components/shell/module-placeholder";

export const Route = createFileRoute("/_authenticated/library")({
  head: () => ({
    meta: [
      { title: "Library | Cyber School Manager" },
      { name: "description", content: "Library module in the Cyber School Manager school ERP workspace." },
      { property: "og:title", content: "Library | Cyber School Manager" },
      { property: "og:description", content: "Library module in the Cyber School Manager school ERP workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <ModulePlaceholder route="/library" />,
});
