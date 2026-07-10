import StatusBadge from "../../../shared/ui/StatusBadge";
import type { GovernanceDocument } from "../types/document";

type Props = {
  document: GovernanceDocument;
};

export default function ApprovalCard({ document }: Props) {
  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: 12,
        padding: 24,
        background: "white",
      }}
    >
      <h2>{document.id}</h2>

      <h3>{document.title}</h3>

      <hr />

      <p>
        <strong>Status</strong>
      </p>

      <StatusBadge status={document.status} />

      <p>
        <strong>Version</strong>
      </p>

      <p>{document.version}</p>

      <p>
        <strong>Approved By</strong>
      </p>

      <p>{document.approvedBy}</p>

      <p>
        <strong>Approval Date</strong>
      </p>

      <p>{document.approvedDate}</p>

      <blockquote>{document.motto}</blockquote>

      <p
        style={{
          marginTop: 20,
          color: "#6B7280",
        }}
      >
        {document.description}
      </p>
    </div>
  );
}