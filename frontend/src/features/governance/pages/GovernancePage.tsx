import { useState } from "react";

import Section from "../../../shared/ui/Section";
import Card from "../../../shared/ui/Card";

import ApprovalCard from "../components/ApprovalCard";
import DocumentRegistry from "../components/DocumentRegistry";
import MarkdownViewer from "../components/MarkdownViewer";

import { governanceDocuments } from "../data/documents";

export default function GovernancePage() {
  const [selectedId, setSelectedId] = useState(
    governanceDocuments[0].id
  );

  const selectedDocument =
    governanceDocuments.find(
      (doc) => doc.id === selectedId
    ) ?? governanceDocuments[0];

  return (
    <>
 <p
  style={{
    color: "#64748B",
    fontSize: "16px",
    marginBottom: "32px",
    maxWidth: "720px",
    lineHeight: 1.7,
  }}
>
  Explore the governance documents that define the
  principles, architecture, and standards of Home
  Finance OS.
</p>

      <Section title="Governance Documents">
        <DocumentRegistry
          documents={governanceDocuments}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </Section>

      <Section title="Document Information">
        <ApprovalCard
          document={selectedDocument}
        />
      </Section>

      <Section title="Document Content">
        <Card>
          <MarkdownViewer
            content={selectedDocument.markdown}
          />
        </Card>
      </Section>
    </>
  );
}