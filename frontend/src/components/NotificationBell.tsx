import React, { useState, useEffect, useRef } from 'react';
import { Bell, Calendar, AlertCircle, CheckCircle2, Clock, CheckCheck, RotateCcw, X, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface EventoNotificacion {
  id: string;
  trabajadorId: number;
  trabajadorNombre: string;
  area?: string;
  tipo: 'INICIO_DESCANSO' | 'FIN_DESCANSO' | 'EN_DESCANSO' | 'VENTA_ACTIVA' | 'PERMISO_ACTIVO';
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
  const [procesandoAccion, setProcesandoAccion] = useState(false);
  const [fechaReferencia, setFechaReferencia] = useState(() => {
    const hoy = new Date();
    const anio = hoy.getFullYear() >= 2026 ? hoy.getFullYear() : 2026;
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  });
  const [eventos, setEventos] = useState<EventoNotificacion[]>([]);
  const [descartadasIds, setDescartadasIds] = useState<string[]>([]);
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
        const json = await res.json();
        const rawEventos = json.data || json.eventos || [];
        const stats = json.estadisticas || json.resumen || null;
        const descartadasServidor: string[] = json.descartadas || [];
        
        const adaptados: EventoNotificacion[] = rawEventos.map((e: any) => ({
          id: e.id || `${e.tipo}-${e.trabajadorId}-${e.fechaEvento || e.fecha}`,
          trabajadorId: e.trabajadorId,
          trabajadorNombre: e.nombres || e.trabajadorNombre,
          area: e.area,
          tipo: e.tipo,
          titulo: e.descripcion,
          descripcion: e.descripcion,
          fecha: e.fechaEvento || e.fecha,
          diasRestantes: e.diasRestantes,
          esHoy: e.diasRestantes === 0,
        }));
        
        setEventos(adaptados);
        setDescartadasIds(descartadasServidor);

        if (stats) {
          setResumen({
            total: stats.totalEventos ?? stats.total ?? 0,
            hoy: stats.hoy ?? 0,
            inicianDescansoProximos: stats.iniciosDescanso ?? stats.inicianDescansoProximos ?? 0,
            retornanTrabajoProximos: stats.finesDescanso ?? stats.retornanTrabajoProximos ?? 0,
            ventasOPermisosActivos: stats.ventas ?? stats.ventasOPermisosActivos ?? 0,
          });
        }
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

  // Eventos activos (no descartados)
  const eventosActivos = eventos.filter((ev) => !descartadasIds.includes(ev.id));
  const totalActivas = eventosActivos.length;

  const handleDescartarTodas = async () => {
    if (!token || eventos.length === 0) return;
    try {
      setProcesandoAccion(true);
      const allIds = eventos.map((e) => e.id);
      setDescartadasIds(allIds);

      await fetch('/api/notificaciones/descartar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ids: allIds })
      });
    } catch (err) {
      console.error('Error al descartar notificaciones:', err);
    } finally {
      setProcesandoAccion(false);
    }
  };

  const handleDescartarUna = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) return;
    try {
      setDescartadasIds((prev) => [...prev, id]);
      await fetch('/api/notificaciones/descartar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ id })
      });
    } catch (err) {
      console.error('Error al descartar notificación:', err);
    }
  };

  const handleRestaurarTodas = async () => {
    if (!token) return;
    try {
      setProcesandoAccion(true);
      setDescartadasIds([]);
      await fetch('/api/notificaciones/restaurar', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      await cargarNotificaciones();
    } catch (err) {
      console.error('Error al restaurar notificaciones:', err);
    } finally {
      setProcesandoAccion(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón Campana con Badge Dinámico */}
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
        {totalActivas > 0 && (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-rose-500 text-white shadow-sm ring-2 ring-slate-950 animate-pulse">
            {totalActivas > 9 ? '9+' : totalActivas}
          </span>
        )}
      </button>

      {/* Dropdown Panel - Diseño Perfeccionado y Equilibrado */}
      {abierto && (
        <div className="absolute right-0 mt-2 w-[420px] max-w-[92vw] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black/80 z-50 overflow-hidden text-slate-200 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          {/* Header Principal */}
          <div className="p-3.5 border-b border-slate-800/80 bg-slate-950/80 flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div className="truncate">
                <h4 className="text-xs font-black text-white tracking-wide">
                  Centro de Alertas de Guardia
                </h4>
                <p className="text-[10.5px] text-slate-400">
                  {totalActivas > 0 ? (
                    <span className="text-amber-400 font-semibold">{totalActivas} alerta(s) pendiente(s)</span>
                  ) : (
                    <span className="text-emerald-400 font-semibold">Bandeja al día (sincronizada)</span>
                  )}
                </p>
              </div>
            </div>

            {/* Acciones: Limpiar / Restaurar */}
            <div className="flex items-center space-x-1.5 shrink-0">
              {totalActivas > 0 ? (
                <button
                  onClick={handleDescartarTodas}
                  disabled={procesandoAccion}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 transition flex items-center space-x-1 disabled:opacity-50"
                  title="Limpiar todas las alertas de la bandeja"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Limpiar</span>
                </button>
              ) : eventos.length > 0 ? (
                <button
                  onClick={handleRestaurarTodas}
                  disabled={procesandoAccion}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center space-x-1 disabled:opacity-50"
                  title="Restaurar alertas archivadas"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar</span>
                </button>
              ) : null}

              <button
                onClick={() => setAbierto(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sub-barra de Simulación de Fecha */}
          <div className="px-3.5 py-2 bg-slate-950/40 border-b border-slate-800/60 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Simular fecha de hoy:</span>
            </span>
            <div className="flex items-center space-x-1.5 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
              <input
                type="date"
                value={fechaReferencia}
                onChange={(e) => setFechaReferencia(e.target.value)}
                className="bg-transparent text-[10.5px] text-slate-200 font-mono outline-none cursor-pointer"
                title="Cambiar fecha de referencia para simular relevos"
              />
            </div>
          </div>

          {/* Quick Stats Pill */}
          {resumen && totalActivas > 0 && (
            <div className="grid grid-cols-3 gap-1 px-3 py-2 bg-slate-950/30 border-b border-slate-800/40 text-[10px]">
              <div className="bg-slate-900/60 p-1.5 rounded-lg border border-slate-800/60 text-center">
                <span className="block text-slate-400 text-[9px]">Salidas Mina</span>
                <span className="font-bold text-amber-400 text-xs">
                  {resumen.inicianDescansoProximos}
                </span>
              </div>
              <div className="bg-slate-900/60 p-1.5 rounded-lg border border-slate-800/60 text-center">
                <span className="block text-slate-400 text-[9px]">Retornos Trabajo</span>
                <span className="font-bold text-cyan-400 text-xs">
                  {resumen.retornanTrabajoProximos}
                </span>
              </div>
              <div className="bg-slate-900/60 p-1.5 rounded-lg border border-slate-800/60 text-center">
                <span className="block text-slate-400 text-[9px]">VD / Permisos</span>
                <span className="font-bold text-emerald-400 text-xs">
                  {resumen.ventasOPermisosActivos}
                </span>
              </div>
            </div>
          )}

          {/* Lista de Eventos o Estado Vacío */}
          <div className="max-h-84 overflow-y-auto divide-y divide-slate-800/50 custom-scrollbar p-1.5">
            {cargando ? (
              <div className="p-8 text-center text-xs text-slate-400">
                <div className="inline-block animate-spin w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full mb-2"></div>
                <p>Calculando próximos relevos...</p>
              </div>
            ) : totalActivas === 0 ? (
              <div className="py-8 px-4 text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 mb-3">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h5 className="text-xs font-bold text-white mb-1">
                  ¡Bandeja de Alertas Limpia!
                </h5>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed mb-3">
                  Has revisado o limpiado todas las alertas de guardia. Los cambios se sincronizan en tiempo real con la app móvil.
                </p>
                {eventos.length > 0 && (
                  <button
                    onClick={handleRestaurarTodas}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restaurar {eventos.length} alertas archivadas</span>
                  </button>
                )}
              </div>
            ) : (
              eventosActivos.map((ev) => {
                const esSalida = ev.tipo === 'INICIO_DESCANSO';
                const esRetorno = ev.tipo === 'FIN_DESCANSO' || ev.tipo === 'EN_DESCANSO';
                const esVD = ev.tipo === 'VENTA_ACTIVA';

                return (
                  <div
                    key={ev.id}
                    onClick={() => onSelectFecha && onSelectFecha(ev.fecha)}
                    className="p-2.5 rounded-xl hover:bg-slate-800/60 transition cursor-pointer flex items-start space-x-2.5 group relative"
                  >
                    <div
                      className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${
                        esSalida
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : esRetorno
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          : esVD
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
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

                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[11.5px] font-bold text-white truncate max-w-[200px]">
                          {ev.trabajadorNombre}
                        </span>
                        <span
                          className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded ${
                            ev.esHoy
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 font-black'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {ev.esHoy ? '¡Hoy!' : `en ${ev.diasRestantes}d`}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-300 font-medium mt-0.5 leading-snug">
                        {ev.descripcion}
                      </div>
                      <div className="flex items-center space-x-2 text-[9px] text-slate-400 mt-1">
                        <span className="font-mono text-slate-400">📅 {ev.fecha}</span>
                        {ev.area && <span className="bg-slate-800/80 px-1.5 py-0.2 rounded text-[8.5px] text-slate-400">{ev.area}</span>}
                      </div>
                    </div>

                    {/* Botón Descartar Individual (✕) */}
                    <button
                      onClick={(e) => handleDescartarUna(ev.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition absolute right-2 top-2"
                      title="Descartar esta notificación"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Informativo */}
          <div className="p-2 border-t border-slate-800 bg-slate-950/70 text-center flex items-center justify-center space-x-1.5 text-[9.5px] text-slate-400">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Sincronizado bidireccionalmente con la aplicación móvil Android</span>
          </div>
        </div>
      )}
    </div>
  );
};
