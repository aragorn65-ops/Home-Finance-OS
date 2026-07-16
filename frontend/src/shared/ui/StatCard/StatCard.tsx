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
    <div className="stat-card">
      <p className="stat-label">
        {label}
      </p>

      <h2 className="stat-value">
        {value}
      </h2>

      {subtitle && (
        <p className="stat-subtitle">
          {subtitle}
        </p>
      )}
    </div>
  );
}