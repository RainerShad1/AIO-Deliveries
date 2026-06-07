'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/store/auth';
import Logo from '@/components/Logo';
import PasswordInput from '@/components/PasswordInput';
import { formatCedula, cedulaDigits } from '@/lib/cedula';

export default function Login() {
  const router = useRouter();
  const setSession = useAuth((s) => s.setSession);
  const [cedula, setCedula] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api<{
        access_token: string;
        role: 'CLIENTE' | 'ADMIN' | 'SUPER_ADMIN';
        businessId: string | null;
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ cedula: cedulaDigits(cedula), password }),
      });
      localStorage.setItem('token', res.access_token);
      const me = await api<{ id: string }>('/users/me');
      setSession(res.access_token, res.role, me.id, res.businessId);
      router.push(
        res.role === 'ADMIN' || res.role === 'SUPER_ADMIN' ? '/admin' : '/menu',
      );
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-5 py-8 max-w-md mx-auto">
      <div className="flex flex-col items-center mb-8">
        <Logo size={72} />
        <h1 className="text-2xl font-extrabold mt-3">AIO Deliverys</h1>
        <p className="text-muted text-sm">Inicia sesion para continuar</p>
      </div>
      <div className="space-y-3">
        <input
          className="input"
          name="username"
          autoComplete="username"
          inputMode="numeric"
          placeholder="Cedula"
          value={cedula}
          onChange={(e) => setCedula(formatCedula(e.target.value))}
        />
        <PasswordInput
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          name="current-password"
        />
      </div>
      {error && <p className="text-primary text-sm mt-3">{error}</p>}
      <button onClick={submit} disabled={loading} className="btn-primary mt-6">
        {loading ? 'Entrando...' : 'Entrar'}
      </button>

      {/* Recuperacion de contrasena asistida por WhatsApp (soporte plataforma) */}
      <a
        href={`https://wa.me/${
          process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ||
          process.env.NEXT_PUBLIC_BUSINESS_WHATSAPP ||
          ''
        }?text=${encodeURIComponent(
          'Hola, olvide mi contrasena de AIO Deliverys. Mi cedula es: ',
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block text-center text-muted text-sm mt-3 underline"
      >
        Olvidaste tu contrasena?
      </a>

      <p className="text-muted text-sm text-center mt-4">
        No tienes cuenta?{' '}
        <Link href="/register" className="text-primary">
          Registrate
        </Link>
      </p>
    </div>
  );
}
