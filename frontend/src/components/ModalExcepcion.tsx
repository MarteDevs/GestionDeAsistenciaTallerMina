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
  Square,
  Trash2,
  Edit3,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

interface DiaBloqueItem {
  fecha: string;
  diaNumero: number;
  diaSemana: string;
  estado: string; // 'DL' | 'VD' | 'P'
  disponibleParaVenta: boolean;
  motivo?: string | null;
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
    estadoActual === 'DL' || estadoActual === 'VD' ? 'VENTA_DESCANSO' : 'PERMISO'
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
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const yaTieneExcepcion = estadoActual === 'VD' || estadoActual === 'P';

  // Cargar el bloque del descanso cuando se abre el modal
  useEffect(() => {
    if (!isOpen || !trabajadorId || !fecha) return;

    setError(null);
    setMensajeExito(null);
    setLoadingBloque(true);
    setMotivo('');

    fetch(`/api/programacion/bloque-descanso?trabajadorId=${trabajadorId}&fecha=${fecha}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.esDescansoBase) {
          setEsDescansoBase(true);
          setDiasBloque(data.dias || []);

          // Si el día clickeado ya tiene motivo, cargarlo
          const diaInicial = (data.dias || []).find((d: DiaBloqueItem) => d.fecha === fecha);
          if (diaInicial && diaInicial.motivo) {
            setMotivo(diaInicial.motivo);
          }

          // Preselección de fechas si está disponible para venta
          if (diaInicial && diaInicial.disponibleParaVenta) {
            setFechasSeleccionadas([fecha]);
          } else {
            // Si ya estaba vendido o no disponible, buscar el primer disponible
            const primerDisp = (data.dias || []).find((d: DiaBloqueItem) => d.disponibleParaVenta);
            setFechasSeleccionadas(primerDisp ? [primerDisp.fecha] : []);
          }
        } else {
          // Es un día laboral normal (fuera de bloque DL)
          setEsDescansoBase(false);
          setDiasBloque([]);
          setFechasSeleccionadas([fecha]);
          setTipo('PERMISO');

          if (data.excepcionActual && data.excepcionActual.motivo) {
            setMotivo(data.excepcionActual.motivo);
          }
        }
      })
      .catch((err) => {
        console.error(err);
        setFechasSeleccionadas([fecha]);
      })
      .finally(() => {
        setLoadingBloque(false);
      });
  }, [isOpen, trabajadorId, fecha, estadoActual]);

  if (!isOpen) return null;

  // Toggle de selección de un día específico con límite estricto de 5 días para venta de descanso
  const toggleDiaSeleccionado = (fechaItem: string) => {
    if (fechasSeleccionadas.includes(fechaItem)) {
      setFechasSeleccionadas((prev) => prev.filter((f) => f !== fechaItem));
      setError(null);
    } else {
      if (tipo === 'VENTA_DESCANSO') {
        const diasVendidos = diasBloque.filter((d) => d.estado === 'VD').length;
        const cupo = Math.max(0, 5 - diasVendidos);
        if (fechasSeleccionadas.length >= cupo) {
          setError(`Por normativa 30x10 solo se permite vender un máximo de 5 días por ciclo. Cupo disponible restante: ${cupo} día(s).`);
          return;
        }
      }
      setError(null);
      setFechasSeleccionadas((prev) => [...prev, fechaItem].sort());
    }
  };

  // Seleccionar hasta el máximo permitido (máx 5 para venta de descanso)
  const seleccionarMaximoPermitido = () => {
    const todosDisponibles = diasBloque
      .filter((d) => d.disponibleParaVenta)
      .map((d) => d.fecha);
    const diasVendidos = diasBloque.filter((d) => d.estado === 'VD').length;
    const cupo = tipo === 'VENTA_DESCANSO' ? Math.max(0, 5 - diasVendidos) : todosDisponibles.length;
    setFechasSeleccionadas(todosDisponibles.slice(0, cupo));
    setError(null);
  };

  // Desmarcar todos
  const desmarcarTodos = () => {
    setFechasSeleccionadas([]);
    setError(null);
  };

  // Anular/Revertir excepción (eliminar VD o P)
  const handleAnularExcepciones = async (fechasAnular: string[]) => {
    if (!isAuthenticated || !token || fechasAnular.length === 0) return;

    const textoConfirmacion =
      fechasAnular.length === 1
        ? `¿Estás seguro de anular la excepción del día ${fechasAnular[0]}? Volverá a su estado programado original.`
        : `¿Estás seguro de anular las excepciones de los ${fechasAnular.length} días seleccionados? Volverán a su estado programado original.`;

    if (!confirm(textoConfirmacion)) return;

    setLoadingSubmit(true);
    setError(null);

    try {
      const response = await fetch('/api/excepciones', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          trabajadorId,
          fechas: fechasAnular,
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Error al anular la excepción');
      }

      setMensajeExito('Excepción anulada exitosamente. Actualizando vista...');
      onSuccess();
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err: any) {
      setError(err.message || 'Error al procesar la anulación');
    } finally {
      setLoadingSubmit(false);
    }
  };

  // Actualizar motivo u observación de una excepción existente
  const handleActualizarMotivo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !token) return;

    setLoadingSubmit(true);
    setError(null);

    try {
      const response = await fetch('/api/excepciones', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          trabajadorId,
          fecha,
          motivo,
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Error al actualizar el motivo');
      }

      setMensajeExito('Motivo actualizado correctamente.');
      onSuccess();
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el motivo');
    } finally {
      setLoadingSubmit(false);
    }
  };

  // Registrar nueva excepción
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

    if (tipo === 'VENTA_DESCANSO') {
      const diasVendidos = diasBloque.filter((d) => d.estado === 'VD').length;
      if (diasVendidos + fechasSeleccionadas.length > 5) {
        setError(`No se puede vender más de 5 días por ciclo de descanso. Ya tiene ${diasVendidos} vendidos y seleccionó ${fechasSeleccionadas.length}.`);
        return;
      }
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
        if (response.status === 401) {
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }
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
  const fechasVendidasBloque = diasBloque.filter((d) => d.estado === 'VD').map((d) => d.fecha);

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
              <h3 className="text-base font-bold tracking-tight">
                {yaTieneExcepcion ? 'Gestión y Modificación de Novedad' : 'Registro de Novedades y Turnos'}
              </h3>
              <p className="text-xs text-slate-300">
                {yaTieneExcepcion
                  ? 'Modifica el motivo o anula la excepción para revertir al cronograma original'
                  : 'Selecciona con un clic los días libres que deseas vender o aplicar permiso'}
              </p>
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
        <form onSubmit={yaTieneExcepcion ? handleActualizarMotivo : handleSubmit} className="p-5 space-y-4">
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
                <span className="font-semibold text-slate-800 flex items-center space-x-1.5">
                  <span>{fecha}</span>
                  {estadoActual === 'VD' && (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-500 text-white">VD</span>
                  )}
                  {estadoActual === 'P' && (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-500 text-white">P</span>
                  )}
                  {estadoActual === 'DL' && (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-purple-600 text-white">DL</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Banner de Acción si el día ya cuenta con excepción registrada */}
          {yaTieneExcepcion && (
            <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-300 text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">
                    {estadoActual === 'VD'
                      ? 'Este día está registrado como Venta de Descanso (VD)'
                      : 'Este día está registrado como Permiso / Falta (P)'}
                  </span>
                  <span className="text-[11px] text-amber-800">
                    Puedes anular la excepción para que regrese a su estado original (
                    {estadoActual === 'VD' ? 'Descanso Libre DL' : 'Labor Normal T'}).
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleAnularExcepciones([fecha])}
                disabled={loadingSubmit}
                className="inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition shrink-0 disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Anular Este Día</span>
              </button>
            </div>
          )}

          {/* Tipo de Operación (Solo cuando se va a registrar algo nuevo) */}
          {!yaTieneExcepcion && (
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
                      ? 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-500/20 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white disabled:opacity-40'
                  }`}
                >
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="text-xs font-bold text-emerald-900">Venta de Descanso (VD)</span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5">
                    Trabajar en días programados libres (DL) - Máx. 5 días
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setTipo('PERMISO')}
                  className={`flex flex-col p-2.5 rounded-xl border text-left transition-all ${
                    tipo === 'PERMISO'
                      ? 'border-rose-500 bg-rose-50/80 ring-2 ring-rose-500/20 shadow-sm'
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
          )}

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
                    <span>Disponibles: <b>{diasDisponiblesTotales}</b></span>
                    <span className="text-amber-700">| Cupo legal restante: <b>{Math.max(0, 5 - diasVendidosPreviamente)}</b> / 5</span>
                    {diasVendidosPreviamente > 0 && (
                      <span className="text-emerald-700">| Ya vendidos: <b>{diasVendidosPreviamente}</b></span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 text-xs">
                  {diasVendidosPreviamente > 0 && (
                    <button
                      type="button"
                      onClick={() => handleAnularExcepciones(fechasVendidasBloque)}
                      disabled={loadingSubmit}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold text-[10px] shadow-sm transition disabled:opacity-50"
                      title="Revertir todas las ventas de este ciclo a días libres"
                    >
                      <RotateCcw className="w-3 h-3 inline mr-1" />
                      Anular Todas ({diasVendidosPreviamente})
                    </button>
                  )}
                  {!yaTieneExcepcion && (
                    <>
                      <button
                        type="button"
                        onClick={seleccionarMaximoPermitido}
                        className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] shadow-sm transition"
                      >
                        Marcar Disponibles
                      </button>
                      <button
                        type="button"
                        onClick={desmarcarTodos}
                        className="px-2 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-semibold text-[10px] border border-purple-200 transition"
                      >
                        Limpiar
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Grilla de Días con Selección */}
              <div className="grid grid-cols-5 gap-2 pt-1">
                {diasBloque.map((item) => {
                  const seleccionado = fechasSeleccionadas.includes(item.fecha);
                  const esVendido = item.estado === 'VD';
                  const esPermiso = item.estado === 'P';

                  return (
                    <button
                      key={item.fecha}
                      type="button"
                      disabled={esVendido || esPermiso}
                      onClick={() => toggleDiaSeleccionado(item.fecha)}
                      className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center relative ${
                        esVendido
                          ? 'bg-emerald-100/80 border-emerald-300 text-emerald-900 cursor-not-allowed shadow-sm'
                          : esPermiso
                          ? 'bg-rose-100/80 border-rose-300 text-rose-900 cursor-not-allowed shadow-sm'
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
                      {esVendido ? (
                        <span className="text-[8.5px] font-black px-1.5 py-0.5 rounded bg-emerald-600 text-white mt-0.5">
                          VD Vendido
                        </span>
                      ) : esPermiso ? (
                        <span className="text-[8.5px] font-black px-1.5 py-0.5 rounded bg-rose-600 text-white mt-0.5">
                          P Permiso
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

              {!yaTieneExcepcion && (
                <div className="text-[11px] font-bold text-purple-900 pt-1 flex items-center justify-between">
                  <span>Has seleccionado: <b>{fechasSeleccionadas.length}</b> días para {tipo === 'VENTA_DESCANSO' ? 'vender' : 'permiso'}</span>
                  {fechasSeleccionadas.length > 0 && (
                    <span className="text-amber-700">({fechasSeleccionadas.join(', ')})</span>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
              <span>Día laborable seleccionado: <b>{fecha}</b>.</span>
            </div>
          )}

          {/* Motivo o Justificación */}
          <div>
            <label className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Motivo o Justificación Operativa</span>
            </label>
            <textarea
              rows={2}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej. Venta voluntaria de días para cobertura de taller en mina"
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition resize-none"
            />
          </div>

          {mensajeExito && (
            <div className="flex items-center space-x-2 rounded-xl bg-emerald-50 border border-emerald-300 p-3 text-xs font-bold text-emerald-900">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{mensajeExito}</span>
            </div>
          )}

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
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div>
              {yaTieneExcepcion && (
                <button
                  type="button"
                  onClick={() => handleAnularExcepciones([fecha])}
                  disabled={loadingSubmit || !isAuthenticated}
                  className="inline-flex items-center space-x-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-300 px-3.5 py-2 text-xs font-bold text-rose-700 transition disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Anular Excepción</span>
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loadingSubmit}
                className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Cerrar
              </button>

              {yaTieneExcepcion ? (
                <button
                  type="submit"
                  disabled={loadingSubmit || !isAuthenticated}
                  className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 disabled:opacity-50 transition"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>{loadingSubmit ? 'Guardando...' : 'Guardar Motivo Modificado'}</span>
                </button>
              ) : (
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
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
