export interface GovernanceDocument {
  id: string;
  title: string;
  icon: string;

  version: string;
  status: "Draft" | "Approved";

  approvedBy: string;
  approvedDate: string;

  motto: string;
  description: string;

  markdown: string;
}