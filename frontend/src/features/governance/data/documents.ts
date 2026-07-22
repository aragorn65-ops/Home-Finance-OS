import helpMarkdown from "../documents/HFOS-HELP-001.md?raw";
import constitutionMarkdown from "../documents/HFOS-CON-001.md?raw";
import type { GovernanceDocument } from "../types/document";

export const governanceDocuments: GovernanceDocument[] = [
  {
    id: "HFOS-HELP-001",

    title: "Quick FAQ & How To",

    icon: "?",

    version: "1.0",

    status: "Approved",

    approvedBy: "Franz Bunsoy",

    approvedDate: "2026-07-23",

    motto: "Start safely. Back up often. Report clearly.",

    description:
      "A short public beta guide for common questions and essential workflows.",

    markdown: helpMarkdown,
  },
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
