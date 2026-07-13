import React from "react";

export interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export default function Card({
  children,
  className = "",
}: CardProps) {
  return (
    <div
      className={[
        "rounded-xl",
        "border",
        "border-gray-200",
        "bg-white",
        "shadow-sm",
        "p-6",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}