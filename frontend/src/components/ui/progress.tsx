export interface ProgressProps {
  value?: number;
  max?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function Progress({ value = 0, max = 100, className, style }: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={className} style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden', ...style }}>
      <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #6366f1, #a855f7)', borderRadius: '3px', transition: 'width 0.3s ease' }} />
    </div>
  );
}
