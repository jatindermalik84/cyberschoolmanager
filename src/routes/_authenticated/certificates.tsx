import { createFileRoute } from "@tanstack/react-router";

import { ModulePlaceholder } from "@/components/shell/module-placeholder";

export const Route = createFileRoute("/_authenticated/certificates")({
  head: () => ({
    meta: [
      { title: "Certificates | Cyber School Manager" },
      { name: "description", content: "Certificates module in the Cyber School Manager school ERP workspace." },
      { property: "og:title", content: "Certificates | Cyber School Manager" },
      { property: "og:description", content: "Certificates module in the Cyber School Manager school ERP workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <ModulePlaceholder route="/certificates" />,
});
