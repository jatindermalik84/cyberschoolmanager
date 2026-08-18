import { createFileRoute } from "@tanstack/react-router";

import { ModulePlaceholder } from "@/components/shell/module-placeholder";

export const Route = createFileRoute("/_authenticated/students")({
  head: () => ({
    meta: [
      { title: "Student Lifecycle | Cyber School Manager" },
      { name: "description", content: "Student Lifecycle module in the Cyber School Manager school ERP workspace." },
      { property: "og:title", content: "Student Lifecycle | Cyber School Manager" },
      { property: "og:description", content: "Student Lifecycle module in the Cyber School Manager school ERP workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <ModulePlaceholder route="/students" />,
});
