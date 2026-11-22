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
  CheckCircle2,
  AlertTriangle,
  Briefcase
} from 'lucide-react';

interface EventoTurno {
  id: string;
  tipo: 'INICIO_DESCANSO' | 'FIN_DESCANSO' | 'EN_DESCANSO' | 'VENTA_ACTIVA' | 'PERMISO_ACTIVO' | 'RETORNO_HOY';
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

interface DescansoProgramado {
  fechaInicio: string;
  fechaFin: string;
}

interface TrabajadorPizarra {
  id: number;
  nombres: string;
  area: string;
  descansosProgramados: DescansoProgramado[];
}

interface FilaPizarra {
  trabajadorId: number;
  nombres: string;
  area: string;
  inicio: string;
  fin: string;
  ingresa: string;
  enDescanso: boolean;
}

const MESES_CORTOS_PIZARRA = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'
];

/** Formatea una fecha ISO (YYYY-MM-DD) como "02-Nov", igual que la pizarra física. */
function formatFechaPizarra(fechaIso: string): string {
  const [, mes, dia] = fechaIso.split('-');
  return `${dia}-${MESES_CORTOS_PIZARRA[parseInt(mes, 10) - 1]}`;
}

/** Suma días a una fecha ISO (YYYY-MM-DD) sin desfases de huso horario. */
function sumarDiasIso(fechaIso: string, dias: number): string {
  const fecha = new Date(`${fechaIso}T00:00:00.000Z`);
  fecha.setUTCDate(fecha.getUTCDate() + dias);
  return fecha.toISOString().slice(0, 10);
}

/**
 * Misma regla de selección que usa el backend/móvil: el descanso activo hoy, si no
 * el que terminó ayer (día de retorno a mina), si no el próximo programado. Fechas
 * ISO comparan correctamente como texto, por eso no hace falta parsear a Date.
 */
function obtenerFilaPizarra(trabajador: TrabajadorPizarra, hoyIso: string): FilaPizarra | null {
  const periodos = trabajador.descansosProgramados.map((d) => ({
    inicio: d.fechaInicio.slice(0, 10),
    fin: d.fechaFin.slice(0, 10),
  }));

  const activo = periodos.find((p) => p.inicio <= hoyIso && hoyIso <= p.fin);
  const retornoHoy = periodos.find((p) => sumarDiasIso(p.fin, 1) === hoyIso);
  const futuro = periodos
    .filter((p) => p.inicio > hoyIso)
    .sort((a, b) => a.inicio.localeCompare(b.inicio))[0];

  const periodo = activo ?? retornoHoy ?? futuro;
  if (!periodo) return null;

  return {
    trabajadorId: trabajador.id,
    nombres: trabajador.nombres,
    area: trabajador.area,
    inicio: periodo.inicio,
    fin: periodo.fin,
    ingresa: sumarDiasIso(periodo.fin, 1),
    enDescanso: !!activo,
  };
}

interface DashboardRelevosProps {
  onVerPlanilla: () => void;
}

export const DashboardRelevos: React.FC<DashboardRelevosProps> = ({ onVerPlanilla }) => {
  const { token } = useAuth();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [trabajadores, setTrabajadores] = useState<TrabajadorPizarra[]>([]);
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
      const [resTurnos, resTrabajadores] = await Promise.all([
        fetch(
          `/api/notificaciones/proximos-turnos?fechaReferencia=${encodeURIComponent(
            fechaReferencia
          )}&diasVentana=7`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        fetch('/api/trabajadores', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (resTurnos.status === 401 || resTrabajadores.status === 401) {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        throw new Error('Sesión expirada o no autorizada');
      }
      if (!resTurnos.ok) {
        throw new Error(`Error en servidor: ${resTurnos.statusText}`);
      }
      const json: ApiResponse = await resTurnos.json();
      if (!json.success) {
        throw new Error('Respuesta no satisfactoria del servidor');
      }
      setData(json);

      if (resTrabajadores.ok) {
        const jsonTrabajadores = await resTrabajadores.json();
        if (jsonTrabajadores.success) {
          setTrabajadores(jsonTrabajadores.data);
        }
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

  // Tablero tipo pizarra: una fila por colaborador con su periodo vigente (NOMBRE | INICIO | FIN | INGRESA)
  const filasPizarra = trabajadores
    .map((t) => obtenerFilaPizarra(t, fechaReferencia))
    .filter((f): f is FilaPizarra => f !== null)
    .filter((f) => {
      const coincideTexto =
        f.nombres.toLowerCase().includes(busqueda.toLowerCase()) ||
        f.area.toLowerCase().includes(busqueda.toLowerCase());
      const coincideArea =
        filtroArea === 'TODAS' || f.area.toLowerCase().includes(filtroArea.toLowerCase());
      return coincideTexto && coincideArea;
    })
    .sort((a, b) => a.nombres.localeCompare(b.nombres));

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-200">
      {/* Top Bar Operativa con Filtros y Fecha */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shadow-sm">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 tracking-tight">
                PANEL DE RELEVOS Y OPERACIONES DIARIAS
              </h2>
              <p className="text-[11px] text-slate-500">
                Monitoreo activo del régimen 30x10, rotación de guardias y ventas de descanso
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
                <option value="Taller Mina">Taller Mina</option>
                <option value="Carpintería Externa">Carpintería Externa</option>
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
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-sm hover:shadow-md transition active:scale-95"
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
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
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
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
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
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
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
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
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
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Encabezado tipo pizarra física: COLABORADOR | INICIO | FIN | INGRESA.
              INGRESA resaltada en ámbar: es la columna que realmente hay que decidir de un vistazo. */}
          <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr] sm:grid-cols-[2fr_1fr_1fr_1fr] gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-3 bg-slate-50 border-b-2 border-amber-200">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
              Colaborador
            </span>
            <span className="text-center text-[10px] font-black text-slate-500 uppercase tracking-wider">
              Inicio
            </span>
            <span className="text-center text-[10px] font-black text-slate-500 uppercase tracking-wider">
              Fin
            </span>
            <span className="text-center text-[10px] font-black text-amber-700 uppercase tracking-wider">
              Ingresa
            </span>
          </div>

          {filasPizarra.length === 0 ? (
            <div className="text-center py-14 text-slate-400 text-xs">
              <CheckCircle2 className="w-6 h-6 mx-auto mb-1.5 text-slate-300" />
              No hay colaboradores con periodos 30x10 registrados.
            </div>
          ) : (
            filasPizarra.map((fila, idx) => {
              const ingresaProximo =
                fila.ingresa >= fechaReferencia &&
                fila.ingresa <= sumarDiasIso(fechaReferencia, 1);
              // Urgente > en descanso > en mina, igual criterio que la app móvil
              const colorEstado = ingresaProximo
                ? 'text-emerald-600'
                : fila.enDescanso
                ? 'text-violet-600'
                : 'text-amber-600';
              const colorPunto = ingresaProximo
                ? 'bg-emerald-500'
                : fila.enDescanso
                ? 'bg-violet-500'
                : 'bg-amber-500';
              return (
                <div
                  key={fila.trabajadorId}
                  className={`grid grid-cols-[1.6fr_1fr_1fr_1fr] sm:grid-cols-[2fr_1fr_1fr_1fr] gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2.5 items-center ${
                    idx !== filasPizarra.length - 1 ? 'border-b border-rose-200/60' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${colorPunto}`} />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{fila.nombres}</p>
                      <p className="text-[10px] text-slate-400 truncate">{fila.area}</p>
                    </div>
                  </div>
                  <span className="text-center text-xs font-semibold text-slate-700 font-mono">
                    {formatFechaPizarra(fila.inicio)}
                  </span>
                  <span className="text-center text-xs font-semibold text-slate-700 font-mono">
                    {formatFechaPizarra(fila.fin)}
                  </span>
                  <span className={`text-center text-xs font-black font-mono ${colorEstado}`}>
                    {formatFechaPizarra(fila.ingresa)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
