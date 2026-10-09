import React, { useState, useEffect } from 'react';
import { ModalExcepcion } from './ModalExcepcion';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Info
} from 'lucide-react';

interface EncabezadoDia {
  diaNumero: number;
  diaSemana: string;
  fecha: string;
}

interface DiaCalculado {
  fecha: string;
  diaNumero: number;
  diaSemana: string;
  estado: '1' | 'DL' | 'VD' | 'P';
  motivoExcepcion?: string | null;
}

interface FilaTrabajador {
  trabajadorId: number;
  nombres: string;
  area: string;
  dias: DiaCalculado[];
  resumen: {
    totalTrabajados: number;
    totalDescansos: number;
    totalVentas: number;
    totalPermisos: number;
  };
}

interface GrillaData {
  anio: number;
  mes: number;
  totalDiasMes: number;
  encabezados: EncabezadoDia[];
  filas: FilaTrabajador[];
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

interface GrillaProgramacionProps {
  refreshTrigger?: number;
}

export const GrillaProgramacion: React.FC<GrillaProgramacionProps> = ({ refreshTrigger = 0 }) => {
  const [anio, setAnio] = useState<number>(2026);
  const [mes, setMes] = useState<number>(1);
  const [data, setData] = useState<GrillaData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [busqueda, setBusqueda] = useState<string>('');
  const [filtroArea, setFiltroArea] = useState<string>('TODAS');
  
  // Estado para la celda y fila activa bajo el cursor (Crosshair UX)
  const [hoveredTrabajadorId, setHoveredTrabajadorId] = useState<number | null>(null);
  const [hoveredFecha, setHoveredFecha] = useState<string | null>(null);

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    trabajadorId: number;
    trabajadorNombre: string;
    fecha: string;
    estadoActual: string;
  }>({
    isOpen: false,
    trabajadorId: 0,
    trabajadorNombre: '',
    fecha: '',
    estadoActual: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/programacion?anio=${anio}&mes=${mes}`);
      const json = await response.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Error al cargar la programación:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [anio, mes, refreshTrigger]);

  const handleMesAnterior = () => {
    if (mes === 1) {
      setMes(12);
      setAnio((prev) => prev - 1);
    } else {
      setMes((prev) => prev - 1);
    }
  };

  const handleMesSiguiente = () => {
    if (mes === 12) {
      setMes(1);
      setAnio((prev) => prev + 1);
    } else {
      setMes((prev) => prev + 1);
    }
  };

  const handleCellClick = (
    trabajadorId: number,
    trabajadorNombre: string,
    dia: DiaCalculado
  ) => {
    setModalState({
      isOpen: true,
      trabajadorId,
      trabajadorNombre,
      fecha: dia.fecha,
      estadoActual: dia.estado,
    });
  };

  // Renderizado visual limpio sin saturación de números "1"
  const renderCellContent = (estado: string) => {
    switch (estado) {
      case '1':
        // Punto minimalista sutil o vacío para no saturar la vista
        return <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-slate-300"></span>;
      case 'DL':
        return <span className="font-extrabold text-[10px] tracking-tight text-purple-700">DL</span>;
      case 'VD':
        return <span className="font-black text-[9px] px-1 py-0.5 rounded bg-emerald-500 text-white shadow-xs">VD</span>;
      case 'P':
        return <span className="font-black text-[9px] px-1 py-0.5 rounded bg-rose-500 text-white shadow-xs">P</span>;
      default:
        return null;
    }
  };

  const getCellBg = (estado: string, isColumnHovered: boolean, isRowHovered: boolean) => {
    if (estado === 'VD') return 'bg-emerald-100/90 border-emerald-300 hover:bg-emerald-200';
    if (estado === 'P') return 'bg-rose-100/90 border-rose-300 hover:bg-rose-200';
    if (estado === 'DL') return 'bg-purple-100/80 border-purple-200 hover:bg-purple-200/90';

    // Para estado '1' (Trabajo)
    if (isRowHovered && isColumnHovered) return 'bg-amber-100/90 border-amber-300';
    if (isRowHovered) return 'bg-amber-50/60 border-slate-100';
    if (isColumnHovered) return 'bg-slate-50/80 border-slate-100';
    return 'bg-white border-slate-100';
  };

  const filasFiltradas = data?.filas.filter((f) => {
    const coincideTexto =
      f.nombres.toLowerCase().includes(busqueda.toLowerCase()) ||
      f.area.toLowerCase().includes(busqueda.toLowerCase());
    const coincideArea =
      filtroArea === 'TODAS' || f.area === filtroArea;
    return coincideTexto && coincideArea;
  }) || [];

  return (
    <div className="w-full space-y-3">
      {/* Barra de Control y Navegación */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Navegador de Fecha */}
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={handleMesAnterior}
                className="p-1 rounded-lg text-slate-600 hover:bg-white hover:text-slate-900 shadow-xs transition"
                title="Mes anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center space-x-2 px-2">
                <select
                  value={mes}
                  onChange={(e) => setMes(Number(e.target.value))}
                  className="bg-transparent font-bold text-slate-900 text-xs focus:outline-none cursor-pointer"
                >
                  {MESES.map((m, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      {m}
                    </option>
                  ))}
                </select>
                <select
                  value={anio}
                  onChange={(e) => setAnio(Number(e.target.value))}
                  className="bg-transparent font-bold text-amber-600 text-xs focus:outline-none cursor-pointer"
                >
                  {[2025, 2026, 2027].map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleMesSiguiente}
                className="p-1 rounded-lg text-slate-600 hover:bg-white hover:text-slate-900 shadow-xs transition"
                title="Mes siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Buscador y Filtro */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Filtrar por colaborador..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20 transition"
              />
            </div>

            <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filtroArea}
                onChange={(e) => setFiltroArea(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="TODAS">Todas las Áreas</option>
                <option value="Taller Carpintería Principal">Principal</option>
                <option value="Carpintería Externa">Externa</option>
              </select>
            </div>
          </div>

          {/* Leyenda y Explicación Visual */}
          <div className="flex items-center space-x-3 text-xs bg-slate-50 border border-slate-100 rounded-xl p-1.5 px-3">
            <div className="flex items-center space-x-1.5" title="Días laborales normales representados de forma limpia para evitar ruido visual">
              <span className="w-2 h-2 rounded-full bg-slate-300 inline-block"></span>
              <span className="font-medium text-slate-600 text-[11px]">Laborable</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="px-1 py-0.5 rounded bg-purple-100 text-purple-800 font-bold text-[10px]">DL</span>
              <span className="font-semibold text-purple-900 text-[11px]">Descanso</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="px-1 py-0.5 rounded bg-emerald-500 text-white font-bold text-[9px]">VD</span>
              <span className="font-semibold text-emerald-900 text-[11px]">Venta</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="px-1 py-0.5 rounded bg-rose-500 text-white font-bold text-[9px]">P</span>
              <span className="font-semibold text-rose-900 text-[11px]">Permiso</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mensaje de Ayuda UX */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 px-2">
        <span className="flex items-center space-x-1">
          <Info className="w-3.5 h-3.5 text-amber-500" />
          <span><b>Tip Operativo:</b> Pasa el cursor por cualquier fila o día para resaltar el cruce (modo cruz). Haz clic en una celda para vender o registrar permisos en bloque (1, 2, 3 o 5 días).</span>
        </span>
        <span className="font-semibold text-slate-600">
          Mostrando {filasFiltradas.length} colaboradores
        </span>
      </div>

      {/* Tabla Interactiva de Turnos */}
      {loading ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-slate-200 flex flex-col items-center justify-center space-y-3">
          <div className="h-8 w-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin"></div>
          <span className="text-xs font-semibold text-slate-600">Cargando matriz mensual...</span>
        </div>
      ) : !data ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-500">
          No hay datos disponibles para el período.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs text-center select-none">
              <thead>
                {/* Cabecera Día de Semana */}
                <tr className="bg-slate-900 text-slate-300 font-medium">
                  <th className="sticky left-0 z-30 bg-slate-900 p-2.5 text-left min-w-[230px] border-r border-slate-800 tracking-wider uppercase text-[10px]">
                    Colaborador / Área
                  </th>
                  {data.encabezados.map((enc) => {
                    const esFinDeSemana = enc.diaSemana === 'SÁB' || enc.diaSemana === 'DOM';
                    const isColHover = hoveredFecha === enc.fecha;
                    return (
                      <th
                        key={enc.fecha}
                        className={`p-1 min-w-[32px] border-r border-slate-800 text-[10px] transition-colors ${
                          isColHover ? 'bg-amber-500/20 text-amber-300 font-bold' : esFinDeSemana ? 'text-amber-400 font-bold' : 'text-slate-400'
                        }`}
                      >
                        {enc.diaSemana}
                      </th>
                    );
                  })}
                  <th className="p-1.5 border-r border-slate-800 bg-slate-800 text-white min-w-[40px] font-bold text-[10px]">T</th>
                  <th className="p-1.5 border-r border-slate-800 bg-purple-950 text-purple-200 min-w-[40px] font-bold text-[10px]">DL</th>
                  <th className="p-1.5 border-r border-slate-800 bg-emerald-950 text-emerald-200 min-w-[40px] font-bold text-[10px]">VD</th>
                  <th className="p-1.5 bg-rose-950 text-rose-200 min-w-[40px] font-bold text-[10px]">P</th>
                </tr>

                {/* Cabecera Número de Día */}
                <tr className="bg-slate-800 text-slate-100 font-bold border-b border-slate-700">
                  <th className="sticky left-0 z-30 bg-slate-800 p-1.5 px-3 text-left border-r border-slate-700 text-slate-300 text-[10px]">
                    {MESES[mes - 1].toUpperCase()} {anio}
                  </th>
                  {data.encabezados.map((enc) => {
                    const isColHover = hoveredFecha === enc.fecha;
                    return (
                      <th
                        key={enc.fecha}
                        className={`p-1 border-r border-slate-700 transition-colors ${
                          isColHover ? 'bg-amber-500/30 text-amber-300 font-extrabold' : 'text-slate-200'
                        }`}
                      >
                        {enc.diaNumero}
                      </th>
                    );
                  })}
                  <th colSpan={4} className="p-1 bg-slate-800 text-[9px] uppercase tracking-wider text-amber-400">
                    Saldos
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filasFiltradas.map((fila) => {
                  const isRowHover = hoveredTrabajadorId === fila.trabajadorId;

                  return (
                    <tr
                      key={fila.trabajadorId}
                      onMouseEnter={() => setHoveredTrabajadorId(fila.trabajadorId)}
                      onMouseLeave={() => setHoveredTrabajadorId(null)}
                      className={`transition-colors group ${isRowHover ? 'bg-amber-50/40' : ''}`}
                    >
                      {/* Columna Colaborador Fija */}
                      <td
                        className={`sticky left-0 z-20 p-2.5 text-left border-r border-slate-200 transition-colors shadow-[2px_0_5px_rgba(0,0,0,0.02)] ${
                          isRowHover ? 'bg-amber-50 text-slate-900 font-extrabold' : 'bg-white text-slate-800 font-bold'
                        }`}
                      >
                        <div className="truncate tracking-tight text-[11px]">
                          {fila.nombres}
                        </div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          {fila.area}
                        </div>
                      </td>

                      {/* Celdas de Días */}
                      {fila.dias.map((dia) => {
                        const isColHover = hoveredFecha === dia.fecha;

                        return (
                          <td
                            key={dia.fecha}
                            onMouseEnter={() => setHoveredFecha(dia.fecha)}
                            onMouseLeave={() => setHoveredFecha(null)}
                            onClick={() =>
                              handleCellClick(fila.trabajadorId, fila.nombres, dia)
                            }
                            title={`${fila.nombres} - ${dia.fecha}\nEstado: ${dia.estado}${
                              dia.motivoExcepcion ? `\nMotivo: ${dia.motivoExcepcion}` : ''
                            }\n(Clic para vender o aplicar permiso)`}
                            className={`cursor-pointer p-1 border-r transition-all duration-75 text-center flex-col justify-center items-center h-9 ${getCellBg(
                              dia.estado,
                              isColHover,
                              isRowHover
                            )}`}
                          >
                            <div className="w-full h-full flex items-center justify-center">
                              {renderCellContent(dia.estado)}
                            </div>
                          </td>
                        );
                      })}

                      {/* Totales */}
                      <td className="p-1 font-bold border-r bg-slate-50 text-slate-800 text-[11px]">
                        {fila.resumen.totalTrabajados}
                      </td>
                      <td className="p-1 font-bold border-r bg-purple-50/70 text-purple-800 text-[11px]">
                        {fila.resumen.totalDescansos}
                      </td>
                      <td className="p-1 font-bold border-r bg-emerald-50/70 text-emerald-800 text-[11px]">
                        {fila.resumen.totalVentas}
                      </td>
                      <td className="p-1 font-bold bg-rose-50/70 text-rose-800 text-[11px]">
                        {fila.resumen.totalPermisos}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Excepciones por Rango */}
      <ModalExcepcion
        isOpen={modalState.isOpen}
        onClose={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
        onSuccess={fetchData}
        trabajadorId={modalState.trabajadorId}
        trabajadorNombre={modalState.trabajadorNombre}
        fecha={modalState.fecha}
        estadoActual={modalState.estadoActual}
      />
    </div>
  );
};
