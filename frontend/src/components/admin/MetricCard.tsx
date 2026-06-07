export default function MetricCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-card rounded-2xl p-4">
      <p className="text-muted text-sm">{label}</p>
      <p className={`text-2xl font-extrabold mt-1 ${accent ? 'text-accent' : ''}`}>
        {value}
      </p>
    </div>
  );
}
