import { createFileRoute } from "@tanstack/react-router";

import { ModulePlaceholder } from "@/components/shell/module-placeholder";

export const Route = createFileRoute("/_authenticated/payroll")({
  head: () => ({
    meta: [
      { title: "Payroll and HR | Cyber School Manager" },
      { name: "description", content: "Payroll and HR module in the Cyber School Manager school ERP workspace." },
      { property: "og:title", content: "Payroll and HR | Cyber School Manager" },
      { property: "og:description", content: "Payroll and HR module in the Cyber School Manager school ERP workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <ModulePlaceholder route="/payroll" />,
});
