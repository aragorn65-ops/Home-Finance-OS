import { useState } from "react";

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
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "300px 1fr",
        gap: "24px",
      }}
    >
      <DocumentRegistry
        documents={governanceDocuments}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />

      <div>
        <ApprovalCard document={selectedDocument} />

        <MarkdownViewer
          content={selectedDocument.markdown}
        />
      </div>
    </div>
  );
}