const BASE = process.env.NEXT_PUBLIC_API_URL!;

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

/**
 * Cliente fetch tipado. Adjunta el JWT automaticamente y normaliza errores.
 */
export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = Array.isArray(err.message) ? err.message.join(', ') : err.message;
    throw new Error(msg || 'Error en la solicitud');
  }
  return res.status === 204 ? (null as T) : res.json();
}
