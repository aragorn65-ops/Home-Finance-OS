import constitutionMarkdown from "../documents/HFOS-CON-001.md?raw";
import type { GovernanceDocument } from "../types/document";

export const governanceDocuments: GovernanceDocument[] = [
  {
    id: "HFOS-CON-001",

    title: "Home Finance OS Product Constitution",

    icon: "📘",

    version: "1.0",

    status: "Approved",

    approvedBy: "Franz Bunsoy",

    approvedDate: "2026-07-10",

    motto: "Financial Clarity Through Transparency",

    description:
      "The governing document of Home Finance OS.",

    markdown: constitutionMarkdown,
  },
];