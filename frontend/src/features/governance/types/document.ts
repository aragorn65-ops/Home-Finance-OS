export type DocumentStatus =
  | "Draft"
  | "Approved"
  | "Pending"
  | "Archived";

export interface GovernanceDocument {
  id: string;

  title: string;

  icon: string;

  version: string;

  status: DocumentStatus;

  approvedBy: string;

  approvedDate: string;

  motto: string;

  description: string;

  markdown: string;
}