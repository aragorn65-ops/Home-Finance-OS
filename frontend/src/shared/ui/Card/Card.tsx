import { ReactNode } from "react";
import "./Card.css";

type CardProps = {
  children: ReactNode;
  className?: string;
};

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