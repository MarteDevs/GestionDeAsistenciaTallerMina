import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserPlus, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login } = useAuth();
  const [esRegistro, setEsRegistro] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombres, setNombres] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensajeInfo, setMensajeInfo] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensajeError(null);
    setMensajeInfo(null);

    try {
      const endpoint = esRegistro ? '/api/auth/registro' : '/api/auth/login';
      const payload = esRegistro
        ? { email, password, nombres }
        : { email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Ocurrió un error en la solicitud.');
      }

      if (esRegistro) {
        setMensajeInfo(data.message);
        setEsRegistro(false);
        setPassword('');
      } else {
        login(data.data.token, data.data.usuario);
        onClose();
      }
    } catch (err: any) {
      setMensajeError(err.message || 'Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-100">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
                {esRegistro ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
              </div>
              <h3 className="text-xl font-bold tracking-tight">
                {esRegistro ? 'Crear Nueva Cuenta' : 'Acceso al Sistema'}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-slate-400 hover:bg-white/10 hover:text-white transition"
            >
              &times;
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-300">
            {esRegistro
              ? 'Regístrate para solicitar acceso. Un administrador validará tu cuenta.'
              : 'Ingresa tus credenciales de supervisor o administrador.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {mensajeInfo && (
            <div className="flex items-start space-x-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{mensajeInfo}</span>
            </div>
          )}

          {mensajeError && (
            <div className="flex items-start space-x-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{mensajeError}</span>
            </div>
          )}

          {esRegistro && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Nombres y Apellidos
              </label>
              <input
                type="text"
                required
                value={nombres}
                onChange={(e) => setNombres(e.target.value)}
                placeholder="Ej. Juan Pérez"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@tallermina.com"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition"
            />
          </div>

          {!esRegistro && (
            <div className="rounded-lg bg-amber-50 border border-amber-200/60 p-2 text-[11px] text-amber-800">
              💡 <b>Credenciales demo para pruebas:</b> <br />
              Admin: <code className="bg-amber-100 px-1 rounded">admin@tallermina.com</code> / pass: <code className="bg-amber-100 px-1 rounded">admin123</code>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-md shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 disabled:opacity-50 transition"
            >
              {loading
                ? 'Procesando...'
                : esRegistro
                ? 'Solicitar Creación de Cuenta'
                : 'Iniciar Sesión'}
            </button>
          </div>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setEsRegistro(!esRegistro);
                setMensajeError(null);
                setMensajeInfo(null);
              }}
              className="text-xs font-semibold text-slate-600 hover:text-amber-600 transition underline underline-offset-2"
            >
              {esRegistro
                ? '¿Ya tienes una cuenta? Inicia sesión aquí'
                : '¿No tienes cuenta? Solicita registrarte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
