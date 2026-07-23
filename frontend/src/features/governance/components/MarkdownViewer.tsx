import ReactMarkdown from "react-markdown";

type Props = {
  content: string;
};

export default function MarkdownViewer({ content }: Props) {
  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border-subtle)",
        color: "var(--color-text)",
        padding: 24,
        borderRadius: 12,
        marginTop: 24,
      }}
    >
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
