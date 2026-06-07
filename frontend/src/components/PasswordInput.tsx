'use client';
import { useState } from 'react';

/**
 * Campo de contrasena con boton para mostrar/ocultar.
 */
export default function PasswordInput({
  value,
  onChange,
  placeholder = 'Contrasena',
  autoComplete = 'current-password',
  name = 'password',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  name?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        className="input pr-12"
        type={show ? 'text' : 'password'}
        name={name}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-lg"
        aria-label={show ? 'Ocultar contrasena' : 'Mostrar contrasena'}
      >
        {show ? '🙈' : '👁️'}
      </button>
    </div>
  );
}
