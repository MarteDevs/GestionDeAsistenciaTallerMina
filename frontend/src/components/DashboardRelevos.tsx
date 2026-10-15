import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Moon,
  Calendar,
  DollarSign,
  Search,
  Filter,
  ArrowRight,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Briefcase
} from 'lucide-react';

interface EventoTurno {
  id: string;
  tipo: 'INICIO_DESCANSO' | 'FIN_DESCANSO' | 'VENTA_ACTIVA' | 'PERMISO_ACTIVO';
  trabajadorId: number;
  nombres: string;
  area: string;
  fechaEvento: string;
  diasRestantes: number;
  descripcion: string;
  detalle: {
    fechaInicio?: string;
    fechaFin?: string;
    cantidadDias?: number;
    motivo?: string | null;
  };
}

interface EstadisticasResponse {
  totalEventos: number;
  hoy: number;
  proximos3Dias: number;
  iniciosDescanso: number;
  finesDescanso: number;
  ventas: number;
}

interface ApiResponse {
  success: boolean;
  fechaReferencia: string;
  diasVentana: number;
  estadisticas: EstadisticasResponse;
  data: EventoTurno[];
}

interface DashboardRelevosProps {
  onVerPlanilla: () => void;
}

export const DashboardRelevos: React.FC<DashboardRelevosProps> = ({ onVerPlanilla }) => {
  const { token } = useAuth();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState<string>('');
  const [filtroArea, setFiltroArea] = useState<string>('TODAS');
  const [fechaReferencia, setFechaReferencia] = useState<string>(() => {
    // Formato YYYY-MM-DD local
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  const fetchNotificaciones = async () => {
    try {
      setLoading(true);
      setError(null);
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
      if (!res.ok) {
        throw new Error(`Error en servidor: ${res.statusText}`);
      }
      const json: ApiResponse = await res.json();
      if (json.success) {
        setData(json);
      } else {
        throw new Error('Respuesta no satisfactoria del servidor');
      }
    } catch (err: any) {
      console.error('Error al cargar datos del dashboard:', err);
      setError(err.message || 'Error al conectar con la API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotificaciones();
  }, [token, fechaReferencia]);

  const eventos = data?.data || [];

  // Filtrado por búsqueda y área
  const eventosFiltrados = eventos.filter((ev) => {
    const coincideTexto =
      ev.nombres.toLowerCase().includes(busqueda.toLowerCase()) ||
      ev.area.toLowerCase().includes(busqueda.toLowerCase()) ||
      ev.descripcion.toLowerCase().includes(busqueda.toLowerCase());
    const coincideArea =
      filtroArea === 'TODAS' || ev.area.toLowerCase().includes(filtroArea.toLowerCase());
    return coincideTexto && coincideArea;
  });

  // Clasificación de eventos
  const proximosSalidaDescanso = eventosFiltrados.filter(
    (e) => e.tipo === 'INICIO_DESCANSO'
  );
  const proximosRetornoMina = eventosFiltrados.filter(
    (e) => e.tipo === 'FIN_DESCANSO'
  );
  const ventasActivas = eventosFiltrados.filter(
    (e) => e.tipo === 'VENTA_ACTIVA'
  );

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-200">
      {/* Top Bar Operativa con Filtros y Fecha */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 tracking-tight">
                PANEL DE RELEVOS Y OPERACIONES DIARIAS
              </h2>
              <p className="text-[11px] text-slate-500">
                Monitoreo activo del régimen 20x10, rotación de guardias y ventas de descanso
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Selector de fecha de referencia */}
            <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <span className="text-[11px] font-bold text-slate-500">Fecha Base:</span>
              <input
                type="date"
                value={fechaReferencia}
                onChange={(e) => setFechaReferencia(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-800 outline-none cursor-pointer"
              />
            </div>

            {/* Buscador */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar colaborador..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20 transition"
              />
            </div>

            {/* Filtro por Área */}
            <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filtroArea}
                onChange={(e) => setFiltroArea(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="TODAS">Todas las Áreas</option>
                <option value="Principal">Taller Principal</option>
                <option value="Externa">Carpintería Externa</option>
              </select>
            </div>

            {/* Botón Refrescar */}
            <button
              onClick={fetchNotificaciones}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              title="Recargar datos de relevos"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-600' : ''}`} />
            </button>

            {/* Acceso Directo a la Planilla */}
            <button
              onClick={onVerPlanilla}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-xs hover:shadow-md transition active:scale-95"
            >
              <span>Ver en Planilla Mensual</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Tarjetas de Métricas Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Alertas Críticas Hoy */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Movimientos Hoy
            </span>
            <div className="text-2xl font-black text-rose-600">
              {data?.estadisticas.hoy ?? 0}
            </div>
            <span className="text-[10px] text-slate-500">
              {data?.estadisticas.proximos3Dias ?? 0} en los próximos 3 días
            </span>
          </div>
          <div className="h-11 w-11 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Salidas a Descanso */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Bajan a Descanso (7d)
            </span>
            <div className="text-2xl font-black text-purple-600">
              {data?.estadisticas.iniciosDescanso ?? 0}
            </div>
            <span className="text-[10px] text-slate-500">Culminan ciclo 20 días</span>
          </div>
          <div className="h-11 w-11 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
            <Moon className="w-5 h-5" />
          </div>
        </div>

        {/* Retornos a Mina */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Suben a Mina (7d)
            </span>
            <div className="text-2xl font-black text-cyan-600">
              {data?.estadisticas.finesDescanso ?? 0}
            </div>
            <span className="text-[10px] text-slate-500">Reincorporación a taller</span>
          </div>
          <div className="h-11 w-11 rounded-2xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>

        {/* Ventas de Descanso Activas */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Ventas de Descanso
            </span>
            <div className="text-2xl font-black text-emerald-600">
              {data?.estadisticas.ventas ?? 0}
            </div>
            <span className="text-[10px] text-slate-500">Días laborados en descanso</span>
          </div>
          <div className="h-11 w-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Grid de Secciones Operativas */}
      {loading ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-slate-200 flex flex-col items-center justify-center space-y-3">
          <div className="h-8 w-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin"></div>
          <span className="text-xs font-semibold text-slate-600">Cargando tablero operativo de relevos...</span>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center text-rose-800 text-sm">
          <p className="font-bold">No se pudo cargar el panel de relevos</p>
          <p className="text-xs text-rose-600 mt-1">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Columna 1: Próximos a salir a descanso */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
            <div className="p-3.5 bg-gradient-to-r from-purple-950 to-slate-900 text-white flex items-center justify-between border-b border-purple-900/40">
              <div className="flex items-center space-x-2">
                <Moon className="w-4 h-4 text-purple-300" />
                <h3 className="text-xs font-black tracking-wide">
                  PRÓXIMOS A SALIR A DESCANSO
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 text-[10px] font-bold border border-purple-500/30">
                {proximosSalidaDescanso.length}
              </span>
            </div>

            <div className="p-3 flex-1 overflow-y-auto max-h-[440px] space-y-2.5">
              {proximosSalidaDescanso.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  <CheckCircle2 className="w-6 h-6 mx-auto mb-1.5 text-slate-300" />
                  No hay salidas a descanso programadas en la ventana actual.
                </div>
              ) : (
                proximosSalidaDescanso.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3 rounded-xl border border-purple-100 bg-purple-50/40 hover:bg-purple-50/80 transition shadow-2xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {ev.nombres}
                      </span>
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                          ev.diasRestantes === 0
                            ? 'bg-purple-600 text-white'
                            : ev.diasRestantes <= 2
                            ? 'bg-purple-200 text-purple-900 font-bold'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {ev.diasRestantes === 0 ? '¡Sale Hoy!' : `En ${ev.diasRestantes} días`}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-snug">
                      {ev.descripcion}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-1 border-t border-purple-100">
                      <span>{ev.area}</span>
                      <span className="font-mono text-purple-700 font-bold">
                        {ev.fechaEvento}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Columna 2: Próximos a retornar / subir a mina */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
            <div className="p-3.5 bg-gradient-to-r from-cyan-950 to-slate-900 text-white flex items-center justify-between border-b border-cyan-900/40">
              <div className="flex items-center space-x-2">
                <Briefcase className="w-4 h-4 text-cyan-300" />
                <h3 className="text-xs font-black tracking-wide">
                  PRÓXIMOS A SUBIR A MINA
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-200 text-[10px] font-bold border border-cyan-500/30">
                {proximosRetornoMina.length}
              </span>
            </div>

            <div className="p-3 flex-1 overflow-y-auto max-h-[440px] space-y-2.5">
              {proximosRetornoMina.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  <Clock className="w-6 h-6 mx-auto mb-1.5 text-slate-300" />
                  No hay retornos de descanso en los próximos 7 días.
                </div>
              ) : (
                proximosRetornoMina.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3 rounded-xl border border-cyan-100 bg-cyan-50/40 hover:bg-cyan-50/80 transition shadow-2xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {ev.nombres}
                      </span>
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                          ev.diasRestantes === 0
                            ? 'bg-cyan-600 text-white'
                            : ev.diasRestantes <= 2
                            ? 'bg-cyan-200 text-cyan-900 font-bold'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {ev.diasRestantes === 0 ? '¡Termina descanso hoy!' : `Retorna en ${ev.diasRestantes} días`}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-snug">
                      {ev.descripcion}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-1 border-t border-cyan-100">
                      <span>{ev.area}</span>
                      <span className="font-mono text-cyan-700 font-bold">
                        {ev.fechaEvento}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Columna 3: Ventas de Descanso y Excepciones */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
            <div className="p-3.5 bg-gradient-to-r from-emerald-950 to-slate-900 text-white flex items-center justify-between border-b border-emerald-900/40">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-emerald-300" />
                <h3 className="text-xs font-black tracking-wide">
                  VENTAS DE DESCANSO ACTIVAS
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 text-[10px] font-bold border border-emerald-500/30">
                {ventasActivas.length}
              </span>
            </div>

            <div className="p-3 flex-1 overflow-y-auto max-h-[440px] space-y-2.5">
              {ventasActivas.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  <CheckCircle2 className="w-6 h-6 mx-auto mb-1.5 text-slate-300" />
                  No hay ventas de descanso registradas en la ventana actual.
                </div>
              ) : (
                ventasActivas.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3 rounded-xl border border-emerald-100 bg-emerald-50/40 hover:bg-emerald-50/80 transition shadow-2xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {ev.nombres}
                      </span>
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                          ev.diasRestantes === 0
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-200 text-emerald-900'
                        }`}
                      >
                        {ev.diasRestantes === 0 ? 'Activa Hoy' : `En ${ev.diasRestantes} días`}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-snug">
                      {ev.descripcion}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-1 border-t border-emerald-100">
                      <span>{ev.area}</span>
                      <span className="font-mono text-emerald-700 font-bold">
                        {ev.fechaEvento}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
