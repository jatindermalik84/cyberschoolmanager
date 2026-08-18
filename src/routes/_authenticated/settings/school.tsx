import { createFileRoute } from "@tanstack/react-router";

import { ModulePlaceholder } from "@/components/shell/module-placeholder";

export const Route = createFileRoute("/_authenticated/settings/school")({
  head: () => ({
    meta: [
      { title: "School Profile | Cyber School Manager" },
      { name: "description", content: "School Profile module in the Cyber School Manager school ERP workspace." },
      { property: "og:title", content: "School Profile | Cyber School Manager" },
      { property: "og:description", content: "School Profile module in the Cyber School Manager school ERP workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <ModulePlaceholder route="/settings/school" />,
});
