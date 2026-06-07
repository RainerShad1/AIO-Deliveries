'use client';
export default function SoundToggle({
  on,
  onToggle,
}: {
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`px-3 py-2 rounded-xl text-sm ${
        on ? 'bg-primary text-black' : 'bg-card text-muted'
      }`}
    >
      {on ? '🔔 Sonido activado' : '🔕 Sonido apagado'}
    </button>
  );
}
