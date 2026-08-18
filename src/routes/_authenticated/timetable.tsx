import { createFileRoute } from "@tanstack/react-router";

import { ModulePlaceholder } from "@/components/shell/module-placeholder";

export const Route = createFileRoute("/_authenticated/timetable")({
  head: () => ({
    meta: [
      { title: "Timetable | Cyber School Manager" },
      { name: "description", content: "Timetable module in the Cyber School Manager school ERP workspace." },
      { property: "og:title", content: "Timetable | Cyber School Manager" },
      { property: "og:description", content: "Timetable module in the Cyber School Manager school ERP workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <ModulePlaceholder route="/timetable" />,
});
