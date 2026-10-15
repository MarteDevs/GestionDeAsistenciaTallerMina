import React, { useState, useEffect, useRef } from 'react';
import { Bell, Calendar, ChevronRight, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface EventoNotificacion {
  trabajadorId: number;
  trabajadorNombre: string;
  tipo: 'INICIO_DESCANSO' | 'FIN_DESCANSO' | 'VENTA_ACTIVA' | 'PERMISO_ACTIVO';
  titulo: string;
  descripcion: string;
  fecha: string;
  diasRestantes: number;
  esHoy: boolean;
}

interface ResumenNotificaciones {
  total: number;
  hoy: number;
  inicianDescansoProximos: number;
  retornanTrabajoProximos: number;
  ventasOPermisosActivos: number;
}

interface NotificationBellProps {
  onSelectFecha?: (fechaIso: string) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ onSelectFecha }) => {
  const { token, isAuthenticated } = useAuth();
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [fechaReferencia, setFechaReferencia] = useState(() => {
    const hoy = new Date();
    const anio = hoy.getFullYear() >= 2026 ? hoy.getFullYear() : 2026;
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  });
  const [eventos, setEventos] = useState<EventoNotificacion[]>([]);
  const [resumen, setResumen] = useState<ResumenNotificaciones | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const cargarNotificaciones = async () => {
    if (!token) return;
    try {
      setCargando(true);
      const res = await fetch(
        `/api/notificaciones/proximos-turnos?fechaReferencia=${encodeURIComponent(
          fechaReferencia
        )}&diasVentana=7`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      if (res.ok) {
        const data = await res.json();
        setEventos(data.eventos || []);
        setResumen(data.resumen || null);
      }
    } catch (err) {
      console.error('Error al cargar notificaciones:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      cargarNotificaciones();
    }
  }, [token, isAuthenticated, fechaReferencia]);

  // Cerrar dropdown al hacer click afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setAbierto(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isAuthenticated) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón Campana con Badge */}
      <button
        onClick={() => setAbierto(!abierto)}
        className={`relative p-2 rounded-xl transition border ${
          abierto
            ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
            : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
        }`}
        title="Alertas de Próximos Turnos y Descansos"
      >
        <Bell className="w-4 h-4" />
        {resumen && resumen.total > 0 && (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-rose-500 text-white shadow-sm ring-2 ring-slate-950 animate-pulse">
            {resumen.total}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {abierto && (
        <div className="absolute right-0 mt-2 w-96 max-w-[90vw] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black/80 z-50 overflow-hidden text-slate-200 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-3.5 border-b border-slate-800/80 bg-slate-950/70 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white tracking-wide">
                  Próximos Turnos y Relevos
                </h4>
                <p className="text-[10px] text-slate-400">Ventana de 7 días hacia adelante</p>
              </div>
            </div>

            {/* Fecha Selector de Simulación / Hoy */}
            <div className="flex items-center space-x-1.5 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
              <Calendar className="w-3 h-3 text-amber-400" />
              <input
                type="date"
                value={fechaReferencia}
                onChange={(e) => setFechaReferencia(e.target.value)}
                className="bg-transparent text-[10px] text-slate-200 font-mono outline-none cursor-pointer"
                title="Cambiar fecha de referencia (Ej. 13/10/2026)"
              />
            </div>
          </div>

          {/* Quick Stats Pill */}
          {resumen && (
            <div className="grid grid-cols-3 gap-1 px-3 py-2 bg-slate-950/40 border-b border-slate-800/50 text-[10px]">
              <div className="bg-slate-900/60 p-1.5 rounded-lg border border-slate-800/60 text-center">
                <span className="block text-slate-400 text-[9px]">Inician DL</span>
                <span className="font-bold text-emerald-400 text-xs">
                  {resumen.inicianDescansoProximos}
                </span>
              </div>
              <div className="bg-slate-900/60 p-1.5 rounded-lg border border-slate-800/60 text-center">
                <span className="block text-slate-400 text-[9px]">Retornan Trabajo</span>
                <span className="font-bold text-cyan-400 text-xs">
                  {resumen.retornanTrabajoProximos}
                </span>
              </div>
              <div className="bg-slate-900/60 p-1.5 rounded-lg border border-slate-800/60 text-center">
                <span className="block text-slate-400 text-[9px]">VD / Permisos</span>
                <span className="font-bold text-amber-400 text-xs">
                  {resumen.ventasOPermisosActivos}
                </span>
              </div>
            </div>
          )}

          {/* Lista de Eventos */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/50 custom-scrollbar p-1">
            {cargando ? (
              <div className="p-8 text-center text-xs text-slate-400">
                <div className="inline-block animate-spin w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full mb-2"></div>
                <p>Calculando turnos...</p>
              </div>
            ) : eventos.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-slate-600" />
                <p>No hay cambios de guardia ni descansos en los próximos 7 días.</p>
              </div>
            ) : (
              eventos.map((ev, idx) => {
                const esSalida = ev.tipo === 'INICIO_DESCANSO';
                const esRetorno = ev.tipo === 'FIN_DESCANSO';
                const esVD = ev.tipo === 'VENTA_ACTIVA';

                return (
                  <div
                    key={idx}
                    onClick={() => onSelectFecha && onSelectFecha(ev.fecha)}
                    className="p-2.5 rounded-xl hover:bg-slate-800/60 transition cursor-pointer flex items-start space-x-2.5"
                  >
                    <div
                      className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${
                        esSalida
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : esRetorno
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          : esVD
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {esSalida ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : esRetorno ? (
                        <Clock className="w-3.5 h-3.5" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-white truncate max-w-[190px]">
                          {ev.trabajadorNombre}
                        </span>
                        <span
                          className={`text-[9px] font-semibold px-1.5 py-0.2 rounded ${
                            ev.esHoy
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {ev.esHoy ? '¡Hoy!' : `en ${ev.diasRestantes}d`}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-300 font-medium mt-0.5">
                        {ev.descripcion}
                      </div>
                      <div className="text-[9px] text-slate-500 mt-0.5 font-mono">
                        {ev.fecha}
                      </div>
                    </div>

                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 self-center shrink-0" />
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-slate-800 bg-slate-950/60 text-center">
            <span className="text-[9px] text-slate-500">
              Sincronizado con API tallerMina (compatible con app Android)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
