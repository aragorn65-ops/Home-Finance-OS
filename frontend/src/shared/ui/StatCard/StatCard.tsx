import "./StatCard.css";

interface StatCardProps {
  label: string;
  value: string;
  subtitle?: string;
}

export default function StatCard({
  label,
  value,
  subtitle,
}: StatCardProps) {
  return (
    <div className="hfos-stat-card">
      <p className="hfos-stat-card__label">
        {label}
      </p>

      <p className="hfos-stat-card__value">
        {value}
      </p>

      {subtitle && (
        <p className="hfos-stat-card__subtitle">
          {subtitle}
        </p>
      )}
    </div>
  );
}
