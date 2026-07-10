import type { GovernanceDocument } from "../types/document";

type Props = {
  documents: GovernanceDocument[];
  selectedId: string;
  onSelect: (id: string) => void;
};

export default function DocumentRegistry({
  documents,
  selectedId,
  onSelect,
}: Props) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: 20,
      }}
    >
      <h3>Knowledge Explorer</h3>

      {documents.map((doc) => (
        <div
          key={doc.id}
          onClick={() => onSelect(doc.id)}
          style={{
            padding: "12px",
            marginBottom: "8px",
            borderRadius: "8px",
            cursor: "pointer",
            background:
              selectedId === doc.id ? "#E8F5E9" : "transparent",
            fontWeight:
              selectedId === doc.id ? "bold" : "normal",
          }}
        >
          {doc.icon} {doc.title}
        </div>
      ))}
    </div>
  );
}