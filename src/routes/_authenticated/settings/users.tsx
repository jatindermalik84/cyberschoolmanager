import { createFileRoute } from "@tanstack/react-router";

import { ModulePlaceholder } from "@/components/shell/module-placeholder";

export const Route = createFileRoute("/_authenticated/settings/users")({
  head: () => ({
    meta: [
      { title: "Users and Roles | Cyber School Manager" },
      { name: "description", content: "Users and Roles module in the Cyber School Manager school ERP workspace." },
      { property: "og:title", content: "Users and Roles | Cyber School Manager" },
      { property: "og:description", content: "Users and Roles module in the Cyber School Manager school ERP workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <ModulePlaceholder route="/settings/users" />,
});
