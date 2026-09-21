type ProgressItem = {
  label: string;
  value: string;
  percent: number;
  tone?: "default" | "success" | "warning";
};

type ProgressListProps = {
  items: readonly ProgressItem[];
};

export function ProgressList({ items }: ProgressListProps) {
  return (
    <div className="progress-list">
      {items.map((item) => (
        <div className="progress-line" key={item.label}>
          <div>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
          <div className="progress-track" aria-label={`${item.label}: ${item.value}`}>
            <div className={`progress-value ${item.tone ?? ""}`} style={{ width: `${item.percent}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
