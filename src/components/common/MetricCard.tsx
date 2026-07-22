type MetricTone = 'primary' | 'ev' | 'fuel';

interface MetricCardProps {
  label: string;
  value: string;
  tone?: MetricTone;
}

export function MetricCard({ label, value, tone = 'primary' }: MetricCardProps) {
  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className={`metric-value ${tone}`}>{value}</div>
    </div>
  );
}
