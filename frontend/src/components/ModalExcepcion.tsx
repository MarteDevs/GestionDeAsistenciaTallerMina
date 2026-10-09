import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Calendar, User, Tag, FileText, Check, X, ShieldAlert, Layers } from 'lucide-react';

interface ModalExcepcionProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  trabajadorId: number;
  trabajadorNombre: string;
  fecha: string;
  estadoActual: string;
}

export const ModalExcepcion: React.FC<ModalExcepcionProps> = ({
  isOpen,
  onClose,
  onSuccess,
  trabajadorId,
  trabajadorNombre,
  fecha,
  estadoActual,
}) => {
  const { token, isAuthenticated } = useAuth();
  const [tipo, setTipo] = useState<'VENTA_DESCANSO' | 'PERMISO'>(
    estadoActual === 'DL' ? 'VENTA_DESCANSO' : 'PERMISO'
  );
  const [cantidadDias, setCantidadDias] = useState<number>(1);
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calcular las fechas consecutivas a partir de la fecha seleccionada
  const generarFechasConsecutivas = (fechaInicioStr: string, numDias: number): string[] => {
    const fechas: string[] = [];
    const baseDate = new Date(`${fechaInicioStr}T00:00:00.000Z`);
    for (let i = 0; i < numDias; i++) {
      const d = new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000);
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      fechas.push(`${y}-${m}-${day}`);
    }
    return fechas;
  };

  const fechasAfectadas = generarFechasConsecutivas(fecha, cantidadDias);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !token) {
      setError('Debes iniciar sesión con una cuenta activa para registrar excepciones.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Usar endpoint en rango/lote
      const response = await fetch('/api/excepciones/rango', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          trabajadorId,
          fechas: fechasAfectadas,
          tipo,
          motivo,
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || 'Error al procesar la solicitud');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-100 transform transition-all">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 p-6 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight">Venta o Permiso de Días</h3>
              <p className="text-xs text-slate-300">Aplica para un día o un rango completo (ej. 5 días juntos)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Info Card */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-400">Trabajador</span>
                <span className="font-semibold text-slate-800 truncate block">{trabajadorNombre}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-400">Fecha de Inicio</span>
                <span className="font-semibold text-slate-800">{fecha}</span>
              </div>
            </div>
          </div>

          {/* Tipo de Excepción */}
          <div>
            <label className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              <Tag className="w-3.5 h-3.5 text-amber-500" />
              <span>Tipo de Transacción</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTipo('VENTA_DESCANSO')}
                className={`flex flex-col p-3 rounded-xl border text-left transition-all ${
                  tipo === 'VENTA_DESCANSO'
                    ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <span className="text-xs font-bold text-emerald-800">Venta de Descanso (VD)</span>
                <span className="text-[10px] text-slate-500 mt-0.5">Laborar en días programados DL</span>
              </button>

              <button
                type="button"
                onClick={() => setTipo('PERMISO')}
                className={`flex flex-col p-3 rounded-xl border text-left transition-all ${
                  tipo === 'PERMISO'
                    ? 'border-rose-500 bg-rose-50/70 ring-2 ring-rose-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <span className="text-xs font-bold text-rose-800">Permiso Especial (P)</span>
                <span className="text-[10px] text-slate-500 mt-0.5">Falta o adelanto en días de labor</span>
              </button>
            </div>
          </div>

          {/* Selector de Cantidad de Días (Venta en Lote) */}
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80">
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-amber-900">
                <Layers className="w-4 h-4 text-amber-600" />
                <span>¿Cuántos días consecutivos deseas procesar?</span>
              </label>
              <span className="text-xs font-black px-2 py-0.5 bg-amber-200 text-amber-900 rounded-lg">
                {cantidadDias} {cantidadDias === 1 ? 'Día' : 'Días'}
              </span>
            </div>

            {/* Botones Rápidos para selección ágil */}
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 5, 10].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setCantidadDias(num)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                    cantidadDias === num
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-white hover:bg-amber-100/70 text-slate-700 border border-amber-200'
                  }`}
                >
                  {num}d
                </button>
              ))}
            </div>

            {/* Rango calculado */}
            <div className="mt-2 text-[11px] text-amber-800 flex items-center justify-between">
              <span>Se aplicará desde: <b>{fechasAfectadas[0]}</b></span>
              <span>Hasta: <b>{fechasAfectadas[fechasAfectadas.length - 1]}</b></span>
            </div>
          </div>

          <div>
            <label className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Motivo o Justificación</span>
            </label>
            <textarea
              rows={2}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej. Venta voluntaria de 5 días de descanso por necesidad operativa"
              className="w-full rounded-xl border border-slate-200 p-2.5 text-sm text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition resize-none"
            />
          </div>

          {error && (
            <div className="flex items-start space-x-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!isAuthenticated && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
              🔒 <b>Inicia sesión</b> con tu cuenta de supervisor o administrador para poder guardar cambios en la base de datos.
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !isAuthenticated}
              className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 disabled:opacity-50 transition"
            >
              {loading ? (
                <span>Procesando {cantidadDias} días...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Aplicar a {cantidadDias} {cantidadDias === 1 ? 'Día' : 'Días'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
