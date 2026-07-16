import "./PageHeader.css";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  actions,
}: PageHeaderProps) {
  return (
    <header className="hfos-page-header">
      <div className="hfos-page-header__content">
        <h1 className="hfos-page-header__title">
          {title}
        </h1>

        {subtitle && (
          <p className="hfos-page-header__subtitle">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="hfos-page-header__actions">
          {actions}
        </div>
      )}
    </header>
  );
}
