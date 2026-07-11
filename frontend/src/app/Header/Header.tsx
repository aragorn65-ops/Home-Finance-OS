import "./Header.css";

interface HeaderProps {
  title?: string;
}

export default function Header({
  title = "Knowledge Center",
}: HeaderProps) {
  return (
    <header className="app-header">

      <div>

        <h1>{title}</h1>

      </div>

    </header>
  );
}