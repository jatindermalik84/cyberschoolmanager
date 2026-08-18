import { createFileRoute } from "@tanstack/react-router";

import { ModulePlaceholder } from "@/components/shell/module-placeholder";

export const Route = createFileRoute("/_authenticated/teacher-diary")({
  head: () => ({
    meta: [
      { title: "Teacher Diary | Cyber School Manager" },
      { name: "description", content: "Teacher Diary module in the Cyber School Manager school ERP workspace." },
      { property: "og:title", content: "Teacher Diary | Cyber School Manager" },
      { property: "og:description", content: "Teacher Diary module in the Cyber School Manager school ERP workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <ModulePlaceholder route="/teacher-diary" />,
});
