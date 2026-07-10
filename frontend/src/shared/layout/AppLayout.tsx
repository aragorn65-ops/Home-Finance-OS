import { ReactNode } from "react";

type AppLayoutProps = {
  sidebar: ReactNode;
  header: ReactNode;
  children: ReactNode;
};

export default function AppLayout({
  sidebar,
  header,
  children,
}: AppLayoutProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "260px 1fr",
        gridTemplateRows: "70px 1fr",
        height: "100vh",
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          gridRow: "1 / span 2",
          background: "#1f2937",
          color: "white",
          padding: "20px",
        }}
      >
        {sidebar}
      </aside>

      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid #ddd",
          padding: "20px",
          display: "flex",
          alignItems: "center",
          background: "#ffffff",
        }}
      >
        {header}
      </header>

      {/* Main Content */}
      <main
        style={{
          padding: "30px",
          overflow: "auto",
          background: "#f8fafc",
        }}
      >
        {children}
      </main>
    </div>
  );
}
