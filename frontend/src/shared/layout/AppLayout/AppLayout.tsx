import "./AppLayout.css";
import type { ReactNode } from "react";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({
  children,
}: AppLayoutProps) {
  return (
    <main className="hfos-layout">
      {children}
    </main>
  );
}