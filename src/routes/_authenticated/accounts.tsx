import { createFileRoute } from "@tanstack/react-router";

import { ModuleDashboard } from "@/components/shell/module-dashboard";

const title = "Accounts | Cyber School Manager";
const description = "Accounts dashboard: setup, daily work and reports for your school in Cyber School Manager.";

export const Route = createFileRoute("/_authenticated/accounts")({
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
  component: () => <ModuleDashboard moduleKey="accounts" />,
});
