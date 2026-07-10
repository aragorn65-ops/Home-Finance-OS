import ReactMarkdown from "react-markdown";

type Props = {
  content: string;
};

export default function MarkdownViewer({ content }: Props) {
  return (
    <div
      style={{
        background: "#fff",
        padding: 24,
        borderRadius: 12,
        marginTop: 24,
      }}
    >
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}