import { createFileRoute } from "@tanstack/react-router";

import { ModulePlaceholder } from "@/components/shell/module-placeholder";

export const Route = createFileRoute("/_authenticated/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory and Procurement | Cyber School Manager" },
      { name: "description", content: "Inventory and Procurement module in the Cyber School Manager school ERP workspace." },
      { property: "og:title", content: "Inventory and Procurement | Cyber School Manager" },
      { property: "og:description", content: "Inventory and Procurement module in the Cyber School Manager school ERP workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <ModulePlaceholder route="/inventory" />,
});
