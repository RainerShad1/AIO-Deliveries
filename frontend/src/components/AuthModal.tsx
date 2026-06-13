'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/store/auth';
import Logo from '@/components/Logo';
import PasswordInput from '@/components/PasswordInput';
import { formatCedula, cedulaDigits } from '@/lib/cedula';

interface AuthResp {
  access_token: string;
  role: 'CLIENTE' | 'ADMIN' | 'SUPER_ADMIN';
  businessId: string | null;
}

// Modal flotante de login/registro. Al completar NO redirige: llama onSuccess
// para que el contexto que lo abrio (ej. el carrito) siga donde estaba.
export default function AuthModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const setSession = useAuth((s) => s.setSession);
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Campos (compartidos donde aplica)
  const [cedula, setCedula] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');

  if (!open) return null;

  // Convierte la ubicacion capturada en la landing en una Address del cliente
  const savePendingAddress = async () => {
    const raw = sessionStorage.getItem('pending_location');
    if (!raw) return;
    try {
      const loc = JSON.parse(raw);
      if (loc.lat == null || loc.lng == null) return; // sin coords, se hara en perfil
      await api('/users/me/addresses', {
        method: 'POST',
        body: JSON.stringify({
          etiqueta: 'Principal',
          direccion: loc.manual || 'Ubicacion GPS',
          lat: loc.lat,
          lng: loc.lng,
        }),
      });
      sessionStorage.removeItem('pending_location');
    } catch {
      /* si falla, el cliente agregara la direccion manualmente */
    }
  };

  const finish = (res: AuthResp, me: { id: string }) => {
    setSession(res.access_token, res.role, me.id, res.businessId);
    if (res.role === 'ADMIN' || res.role === 'SUPER_ADMIN') {
      router.push('/admin');
    } else {
      onSuccess();
    }
  };

  const doLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api<AuthResp>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ cedula: cedulaDigits(cedula), password }),
      });
      localStorage.setItem('token', res.access_token);
      const me = await api<{ id: string }>('/users/me');
      finish(res, me);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const doRegister = async () => {
    setError('');
    if (password !== confirmPassword) {
      setError('Las contrasenas no coinciden');
      return;
    }
    if (password.length < 8) {
      setError('La contrasena debe tener al menos 8 caracteres');
      return;
    }
    setLoading(true);
    try {
      const res = await api<AuthResp>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          cedula: cedulaDigits(cedula),
          password,
          nombre,
          telefono,
        }),
      });
      localStorage.setItem('token', res.access_token);
      const me = await api<{ id: string }>('/users/me');
      await savePendingAddress();
      finish(res, me);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      {/* Fondo oscuro: tocar fuera cierra */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Tarjeta del modal */}
      <div className="relative w-full sm:max-w-md bg-bg border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 pb-8 animate-fade-in-up max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 w-9 h-9 rounded-full bg-card flex items-center justify-center text-muted"
          aria-label="Cerrar"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col items-center mb-5 mt-2">
          <Logo size={56} />
          <h2 className="text-xl font-extrabold mt-2">
            {mode === 'login' ? 'Inicia sesion' : 'Crear cuenta'}
          </h2>
          <p className="text-muted text-sm text-center mt-1">
            {mode === 'login'
              ? 'Entra para completar tu pedido'
              : 'Crea tu cuenta para pedir'}
          </p>
        </div>

        <div className="space-y-3">
          {mode === 'register' && (
            <input
              className="input"
              name="name"
              autoComplete="name"
              placeholder="Nombre completo"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          )}
          <input
            className="input"
            name="username"
            autoComplete="username"
            inputMode="numeric"
            placeholder="Cedula (000-0000000-0)"
            value={cedula}
            onChange={(e) => setCedula(formatCedula(e.target.value))}
          />
          {mode === 'register' && (
            <input
              className="input"
              name="phone"
              autoComplete="tel"
              inputMode="numeric"
              placeholder="Telefono (10 digitos)"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
            />
          )}
          <PasswordInput
            value={password}
            onChange={setPassword}
            placeholder={mode === 'register' ? 'Contrasena (min. 8)' : 'Contrasena'}
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            name={mode === 'register' ? 'new-password' : 'current-password'}
          />
          {mode === 'register' && (
            <PasswordInput
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Repetir contrasena"
              autoComplete="new-password"
              name="confirm-password"
            />
          )}
        </div>

        {error && <p className="text-primary text-sm mt-3">{error}</p>}

        <button
          onClick={mode === 'login' ? doLogin : doRegister}
          disabled={loading}
          className="btn-primary mt-5"
        >
          {loading
            ? mode === 'login'
              ? 'Entrando...'
              : 'Creando...'
            : mode === 'login'
              ? 'Entrar'
              : 'Registrarme'}
        </button>

        <p className="text-muted text-sm text-center mt-4">
          {mode === 'login' ? (
            <>
              No tienes cuenta?{' '}
              <button
                onClick={() => {
                  setMode('register');
                  setError('');
                }}
                className="text-primary font-medium"
              >
                Registrate
              </button>
            </>
          ) : (
            <>
              Ya tienes cuenta?{' '}
              <button
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className="text-primary font-medium"
              >
                Inicia sesion
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
