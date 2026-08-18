import { createFileRoute } from "@tanstack/react-router";

import { ModulePlaceholder } from "@/components/shell/module-placeholder";

export const Route = createFileRoute("/_authenticated/attendance")({
  head: () => ({
    meta: [
      { title: "Attendance | Cyber School Manager" },
      { name: "description", content: "Attendance module in the Cyber School Manager school ERP workspace." },
      { property: "og:title", content: "Attendance | Cyber School Manager" },
      { property: "og:description", content: "Attendance module in the Cyber School Manager school ERP workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <ModulePlaceholder route="/attendance" />,
});
