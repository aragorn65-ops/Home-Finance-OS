import Card from "../../../shared/ui/Card";
import Divider from "../../../shared/ui/Divider";
import StatusBadge from "../../../shared/ui/StatusBadge";

import type { GovernanceDocument } from "../types/document";

type Props = {
  document: GovernanceDocument;
};

export default function ApprovalCard({
  document,
}: Props) {
  return (
    <Card>

      <h2>{document.id}</h2>

      <h3>{document.title}</h3>

      <Divider />

      <strong>Status</strong>

      <br />

      <StatusBadge
        status={document.status}
      />

      <Divider />

      <strong>Version</strong>

      <p>{document.version}</p>

      <strong>Approved By</strong>

      <p>{document.approvedBy}</p>

      <strong>Approval Date</strong>

      <p>{document.approvedDate}</p>

      <Divider />

      <blockquote>

        {document.motto}

      </blockquote>

      <p>

        {document.description}

      </p>

    </Card>
  );
}