// Logo de la plataforma AIO Deliverys: emblema circular (anillo amarillo con
// los negocios conectados por una ruta). SVG inline: escala a cualquier
// tamano sin cargar imagenes.
export default function Logo({ size = 64 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label="AIO Deliverys"
    >
      <circle cx="60" cy="60" r="58" fill="#0B0B0F" />
      <circle cx="60" cy="60" r="46" fill="none" stroke="#FFD400" strokeWidth="7" />
      <path
        d="M44 46 Q60 38 76 52 Q72 72 54 80"
        fill="none"
        stroke="#FFD400"
        strokeWidth="3"
        strokeDasharray="0.1 8"
        strokeLinecap="round"
      />
      <circle cx="44" cy="46" r="6.5" fill="#ffffff" />
      <circle cx="76" cy="52" r="6.5" fill="#ffffff" />
      <circle cx="54" cy="80" r="6.5" fill="#ffffff" />
      <circle cx="54" cy="80" r="12" fill="none" stroke="#FFD400" strokeWidth="2.5" />
    </svg>
  );
}
