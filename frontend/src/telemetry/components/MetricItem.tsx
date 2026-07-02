type MetricItemProps = {
  label: string;
  value: string;
  danger?: boolean;
};

export function MetricItem({ label, value, danger = false }: MetricItemProps) {
  return (
    <div className="metric">
      <label>{label}</label>
      <span className={danger ? "text-danger" : ""}>{value}</span>
    </div>
  );
}
