import { createFileRoute } from "@tanstack/react-router";

import { ModulePlaceholder } from "@/components/shell/module-placeholder";

export const Route = createFileRoute("/_authenticated/accounts")({
  head: () => ({
    meta: [
      { title: "Accounts | Cyber School Manager" },
      { name: "description", content: "Accounts module in the Cyber School Manager school ERP workspace." },
      { property: "og:title", content: "Accounts | Cyber School Manager" },
      { property: "og:description", content: "Accounts module in the Cyber School Manager school ERP workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <ModulePlaceholder route="/accounts" />,
});
