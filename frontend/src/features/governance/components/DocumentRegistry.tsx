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
        background: "var(--color-surface)",
        border: "1px solid var(--color-border-subtle)",
        borderRadius: 12,
        padding: 20,
        color: "var(--color-text)",
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
            color:
              selectedId === doc.id
                ? "var(--color-success-text)"
                : "var(--color-text)",
            background:
              selectedId === doc.id
                ? "var(--color-success-background)"
                : "transparent",
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
