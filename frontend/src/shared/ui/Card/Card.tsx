import "./Card.css";
import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export default function Card({
  children,
  className = "",
}: CardProps) {
  return (
    <div className={`hfos-card ${className}`}>
      {children}
    </div>
  );
}