import { createFileRoute } from "@tanstack/react-router";

import { ModulePlaceholder } from "@/components/shell/module-placeholder";

export const Route = createFileRoute("/_authenticated/hostel")({
  head: () => ({
    meta: [
      { title: "Hostel | Cyber School Manager" },
      { name: "description", content: "Hostel module in the Cyber School Manager school ERP workspace." },
      { property: "og:title", content: "Hostel | Cyber School Manager" },
      { property: "og:description", content: "Hostel module in the Cyber School Manager school ERP workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <ModulePlaceholder route="/hostel" />,
});
