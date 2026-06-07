/**
 * Formatea una cedula dominicana al patron 000-0000000-0 mientras se escribe.
 * Solo toma digitos y los agrupa: 3 - 7 - 1.
 */
export function formatCedula(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11);
  const p1 = d.slice(0, 3);
  const p2 = d.slice(3, 10);
  const p3 = d.slice(10, 11);
  let out = p1;
  if (p2) out += '-' + p2;
  if (p3) out += '-' + p3;
  return out;
}

/** Devuelve solo los digitos de la cedula (para enviar al backend). */
export function cedulaDigits(value: string): string {
  return value.replace(/\D/g, '');
}
