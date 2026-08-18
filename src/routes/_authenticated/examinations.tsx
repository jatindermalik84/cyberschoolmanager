import { createFileRoute } from "@tanstack/react-router";

import { ModulePlaceholder } from "@/components/shell/module-placeholder";

export const Route = createFileRoute("/_authenticated/examinations")({
  head: () => ({
    meta: [
      { title: "Examinations | Cyber School Manager" },
      { name: "description", content: "Examinations module in the Cyber School Manager school ERP workspace." },
      { property: "og:title", content: "Examinations | Cyber School Manager" },
      { property: "og:description", content: "Examinations module in the Cyber School Manager school ERP workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <ModulePlaceholder route="/examinations" />,
});
