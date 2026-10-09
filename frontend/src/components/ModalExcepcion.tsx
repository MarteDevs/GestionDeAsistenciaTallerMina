import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Calendar,
  User,
  Tag,
  FileText,
  Check,
  X,
  ShieldAlert,
  Layers,
  ArrowRightLeft,
  CheckSquare,
  Square
} from 'lucide-react';

interface DiaBloqueItem {
  fecha: string;
  diaNumero: number;
  diaSemana: string;
  estado: string; // 'DL' | 'VD' | 'P'
  disponibleParaVenta: boolean;
}

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

  // Días del bloque de descanso obtenidos del backend
  const [diasBloque, setDiasBloque] = useState<DiaBloqueItem[]>([]);
  const [esDescansoBase, setEsDescansoBase] = useState<boolean>(false);
  const [loadingBloque, setLoadingBloque] = useState<boolean>(false);

  // Fechas seleccionadas con checkboxes
  const [fechasSeleccionadas, setFechasSeleccionadas] = useState<string[]>([]);
  
  const [motivo, setMotivo] = useState('');
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar el bloque del descanso cuando se abre el modal
  useEffect(() => {
    if (!isOpen || !trabajadorId || !fecha) return;

    setError(null);
    setLoadingBloque(true);

    fetch(`/api/programacion/bloque-descanso?trabajadorId=${trabajadorId}&fecha=${fecha}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.esDescansoBase) {
          setEsDescansoBase(true);
          setDiasBloque(data.dias);

          // Si es venta de descanso, pre-seleccionar solo la fecha en la que hizo clic si está disponible
          const diaInicial = data.dias.find((d: DiaBloqueItem) => d.fecha === fecha);
          if (diaInicial && diaInicial.disponibleParaVenta) {
            setFechasSeleccionadas([fecha]);
          } else {
            // Si ya estaba vendido, buscar el primer disponible
            const primerDisp = data.dias.find((d: DiaBloqueItem) => d.disponibleParaVenta);
            setFechasSeleccionadas(primerDisp ? [primerDisp.fecha] : []);
          }
        } else {
          // Es un día laboral normal (fuera de bloque DL)
          setEsDescansoBase(false);
          setDiasBloque([]);
          setFechasSeleccionadas([fecha]);
          setTipo('PERMISO');
        }
      })
      .catch((err) => {
        console.error(err);
        setFechasSeleccionadas([fecha]);
      })
      .finally(() => {
        setLoadingBloque(false);
      });
  }, [isOpen, trabajadorId, fecha]);

  if (!isOpen) return null;

  // Toggle de selección de un día específico
  const toggleDiaSeleccionado = (fechaItem: string) => {
    setFechasSeleccionadas((prev) =>
      prev.includes(fechaItem)
        ? prev.filter((f) => f !== fechaItem)
        : [...prev, fechaItem].sort()
    );
  };

  // Seleccionar todos los días disponibles del período de descanso
  const seleccionarTodosLosDisponibles = () => {
    const todosDisponibles = diasBloque
      .filter((d) => d.disponibleParaVenta)
      .map((d) => d.fecha);
    setFechasSeleccionadas(todosDisponibles);
  };

  // Desmarcar todos
  const desmarcarTodos = () => {
    setFechasSeleccionadas([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !token) {
      setError('Debes iniciar sesión con una cuenta activa para registrar transacciones.');
      return;
    }

    if (fechasSeleccionadas.length === 0) {
      setError('Debes seleccionar al menos un día disponible para procesar la transacción.');
      return;
    }

    setLoadingSubmit(true);
    setError(null);

    try {
      const response = await fetch('/api/excepciones/rango', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          trabajadorId,
          fechas: fechasSeleccionadas,
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
      setLoadingSubmit(false);
    }
  };

  const diasDisponiblesTotales = diasBloque.filter((d) => d.disponibleParaVenta).length;
  const diasVendidosPreviamente = diasBloque.filter((d) => d.estado === 'VD').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-100 transform transition-all">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Registro de Novedades y Turnos</h3>
              <p className="text-xs text-slate-300">Selecciona con un clic los días libres que deseas vender o aplicar permiso</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Card Info Colaborador */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-400">Colaborador</span>
                <span className="font-semibold text-slate-800 truncate block">{trabajadorNombre}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-400">Día Consultado</span>
                <span className="font-semibold text-slate-800">{fecha}</span>
              </div>
            </div>
          </div>

          {/* Tipo de Operación */}
          <div>
            <label className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              <Tag className="w-3.5 h-3.5 text-amber-500" />
              <span>Tipo de Operación Minera</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={!esDescansoBase}
                onClick={() => setTipo('VENTA_DESCANSO')}
                className={`flex flex-col p-2.5 rounded-xl border text-left transition-all ${
                  tipo === 'VENTA_DESCANSO'
                    ? 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white disabled:opacity-40'
                }`}
              >
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-xs font-bold text-emerald-900">Venta de Descanso (VD)</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5">
                  Trabajar en días programados libres (DL)
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTipo('PERMISO')}
                className={`flex flex-col p-2.5 rounded-xl border text-left transition-all ${
                  tipo === 'PERMISO'
                    ? 'border-rose-500 bg-rose-50/80 ring-2 ring-rose-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center space-x-1.5">
                  <ArrowRightLeft className="w-3 h-3 text-rose-500" />
                  <span className="text-xs font-bold text-rose-900">Permiso / Adelanto (P)</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5">
                  Falta o adelanto en su ciclo de labor
                </span>
              </button>
            </div>
          </div>

          {/* LISTA DE DÍAS DEL PERÍODO CON CHECKBOXES INTERACTIVOS */}
          {loadingBloque ? (
            <div className="p-6 text-center text-xs text-slate-500">Cargando días del período...</div>
          ) : esDescansoBase ? (
            <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-purple-950 flex items-center space-x-1.5">
                    <Layers className="w-4 h-4 text-purple-700" />
                    <span>Días Libres de este Período ({diasBloque.length} días totales)</span>
                  </h4>
                  <div className="text-[11px] text-purple-800 space-x-2 mt-0.5">
                    <span>Disponibles para vender: <b>{diasDisponiblesTotales}</b></span>
                    {diasVendidosPreviamente > 0 && (
                      <span className="text-emerald-700">| Ya vendidos: <b>{diasVendidosPreviamente}</b></span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 text-xs">
                  <button
                    type="button"
                    onClick={seleccionarTodosLosDisponibles}
                    className="px-2 py-1 rounded bg-purple-200 hover:bg-purple-300 text-purple-900 font-bold text-[10px] transition"
                  >
                    Marcar Todos ({diasDisponiblesTotales})
                  </button>
                  <button
                    type="button"
                    onClick={desmarcarTodos}
                    className="px-2 py-1 rounded bg-white hover:bg-slate-100 text-slate-700 font-semibold text-[10px] border border-purple-200 transition"
                  >
                    Limpiar
                  </button>
                </div>
              </div>

              {/* Grilla de Días con Selección */}
              <div className="grid grid-cols-5 gap-2 pt-1">
                {diasBloque.map((item) => {
                  const seleccionado = fechasSeleccionadas.includes(item.fecha);
                  const deshabilitado = !item.disponibleParaVenta;

                  return (
                    <button
                      key={item.fecha}
                      type="button"
                      disabled={deshabilitado}
                      onClick={() => toggleDiaSeleccionado(item.fecha)}
                      className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center relative ${
                        deshabilitado
                          ? 'bg-emerald-100/70 border-emerald-300 text-emerald-800 cursor-not-allowed opacity-80'
                          : seleccionado
                          ? 'bg-purple-700 border-purple-800 text-white shadow-md ring-2 ring-purple-400'
                          : 'bg-white hover:bg-purple-100/70 border-purple-200 text-slate-800 cursor-pointer'
                      }`}
                    >
                      <span className="text-[10px] uppercase font-bold opacity-80 leading-tight">
                        {item.diaSemana}
                      </span>
                      <span className="text-sm font-black leading-none my-0.5">
                        {item.diaNumero}
                      </span>

                      {/* Estado */}
                      {deshabilitado ? (
                        <span className="text-[9px] font-extrabold px-1 rounded bg-emerald-600 text-white">
                          Vendido
                        </span>
                      ) : (
                        <div className="mt-0.5">
                          {seleccionado ? (
                            <CheckSquare className="w-3.5 h-3.5 text-amber-300" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-purple-400" />
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="text-[11px] font-bold text-purple-900 pt-1 flex items-center justify-between">
                <span>Has seleccionado: <b>{fechasSeleccionadas.length}</b> días para {tipo === 'VENTA_DESCANSO' ? 'vender' : 'permiso'}</span>
                {fechasSeleccionadas.length > 0 && (
                  <span className="text-amber-700">({fechasSeleccionadas.join(', ')})</span>
                )}
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
              <span>Día laborable seleccionado: <b>{fecha}</b> (Se aplicará como Permiso / Adelanto laboral).</span>
            </div>
          )}

          {/* Motivo */}
          <div>
            <label className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Motivo o Justificación Operativa</span>
            </label>
            <textarea
              rows={2}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej. Venta voluntaria de días para cobertura de taller"
              className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition resize-none"
            />
          </div>

          {error && (
            <div className="flex items-start space-x-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!isAuthenticated && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-900">
              🔒 <b>Inicia sesión</b> para guardar cambios en MySQL.
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loadingSubmit}
              className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loadingSubmit || !isAuthenticated || fechasSeleccionadas.length === 0}
              className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 disabled:opacity-50 transition"
            >
              {loadingSubmit ? (
                <span>Guardando...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Confirmar ({fechasSeleccionadas.length} {fechasSeleccionadas.length === 1 ? 'Día' : 'Días'})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
