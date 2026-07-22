type MetricTone = 'default' | 'ev' | 'fuel' | 'primary';

interface MetricCardProps {
  label: string;
  value: string;
  tone?: MetricTone;
}

export function MetricCard({
  label,
  value,
  tone = 'default',
}: MetricCardProps) {
  const toneClass =
    tone === 'ev'
      ? 'ev'
      : tone === 'fuel'
      ? 'fuel'
      : tone === 'primary'
      ? 'primary'
      : '';

  return (
    <div className="metric">
      <div className="metric-label">{label}</div>
      <div className={`metric-value ${toneClass}`.trim()}>{value}</div>
    </div>
  );
}