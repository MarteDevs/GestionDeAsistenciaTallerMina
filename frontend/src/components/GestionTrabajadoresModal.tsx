import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Edit2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw
} from 'lucide-react';

interface TrabajadorItem {
  id: number;
  nombres: string;
  area: string;
  activo: boolean;
  createdAt: string;
  _count?: {
    descansosProgramados: number;
    excepciones: number;
  };
}

interface GestionTrabajadoresModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTrabajadoresActualizados: () => void;
}

export const GestionTrabajadoresModal: React.FC<GestionTrabajadoresModalProps> = ({
  isOpen,
  onClose,
  onTrabajadoresActualizados,
}) => {
  const { token } = useAuth();
  const [trabajadores, setTrabajadores] = useState<TrabajadorItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Formulario de nuevo trabajador o edición
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState<number | null>(null);
  const [nombres, setNombres] = useState('');
  const [area, setArea] = useState('Taller Carpintería Principal');
  const [fechaPrimerDescanso, setFechaPrimerDescanso] = useState('');
  const [cantidadCiclos, setCantidadCiclos] = useState(10);
  const [proyectando2027, setProyectando2027] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  const fetchTrabajadores = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/trabajadores?incluirInactivos=true', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setTrabajadores(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTrabajadores();
    }
  }, [isOpen, token]);

  const limpiarFormulario = () => {
    setModoEdicion(false);
    setIdEditando(null);
    setNombres('');
    setArea('Taller Carpintería Principal');
    setFechaPrimerDescanso('');
    setCantidadCiclos(10);
    setMensajeError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setMensajeError(null);
    setMensajeExito(null);

    try {
      if (modoEdicion && idEditando) {
        // Actualizar
        const res = await fetch(`/api/trabajadores/${idEditando}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ nombres, area }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setMensajeExito('Trabajador actualizado correctamente.');
      } else {
        // Crear con autoproyección 20x10
        const res = await fetch('/api/trabajadores', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            nombres,
            area,
            fechaPrimerDescanso: fechaPrimerDescanso || null,
            cantidadCiclos,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setMensajeExito('Trabajador y su ciclo 20x10 creados exitosamente.');
      }

      limpiarFormulario();
      fetchTrabajadores();
      onTrabajadoresActualizados();
    } catch (err: any) {
      setMensajeError(err.message || 'Error al guardar los datos.');
    }
  };

  const handleToggleBaja = async (id: number, estadoActual: boolean) => {
    if (!token) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/trabajadores/${id}/baja`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ activo: !estadoActual }),
      });
      const data = await res.json();
      if (data.success) {
        setTrabajadores((prev) =>
          prev.map((t) => (t.id === id ? { ...t, activo: !estadoActual } : t))
        );
        onTrabajadoresActualizados();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleIniciarEdicion = (t: TrabajadorItem) => {
    setModoEdicion(true);
    setIdEditando(t.id);
    setNombres(t.nombres);
    setArea(t.area);
    setFechaPrimerDescanso('');
  };

  const handleProyectar2027 = async () => {
    if (!token) return;
    if (!confirm('¿Deseas autogenerar la programación completa para el año 2027 basada en el último descanso de 2026 de cada personal activo?')) {
      return;
    }

    setProyectando2027(true);
    setMensajeError(null);
    setMensajeExito(null);

    try {
      const res = await fetch('/api/trabajadores/proyectar-anio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ anioDestino: 2027 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMensajeExito(data.message);
      onTrabajadoresActualizados();
    } catch (err: any) {
      setMensajeError(err.message || 'Error al proyectar el año 2027.');
    } finally {
      setProyectando2027(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 p-6 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight">Gestión de Personal y Proyección 20x10</h3>
              <p className="text-xs text-slate-300">
                Altas, bajas, modificación y proyección automática de ciclos (2026 / 2027)
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleProyectar2027}
              disabled={proyectando2027}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{proyectando2027 ? 'Proyectando...' : 'Proyectar 2027 (Auto 20x10)'}</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {mensajeExito && (
            <div className="flex items-center space-x-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{mensajeExito}</span>
            </div>
          )}

          {mensajeError && (
            <div className="flex items-center space-x-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{mensajeError}</span>
            </div>
          )}

          {/* Formulario de Alta o Edición */}
          <form onSubmit={handleSubmit} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-2">
                <UserPlus className="w-4 h-4 text-amber-600" />
                <span>{modoEdicion ? 'Modificar Datos de Colaborador' : 'Registrar Nuevo Colaborador con Ciclo 20x10'}</span>
              </h4>
              {modoEdicion && (
                <button
                  type="button"
                  onClick={limpiarFormulario}
                  className="text-xs text-slate-500 hover:text-slate-800 underline"
                >
                  Cancelar Edición
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  value={nombres}
                  onChange={(e) => setNombres(e.target.value)}
                  placeholder="Ej. RAMOS VILLEGAS CESAR"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                  Área / Especialidad
                </label>
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="Taller Carpintería Principal">Taller Carpintería Principal</option>
                  <option value="Carpintería Externa">Carpintería Externa</option>
                  <option value="Operaciones Especiales">Operaciones Especiales</option>
                </select>
              </div>

              {!modoEdicion && (
                <>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                      Fecha Primer Descanso (FI)
                    </label>
                    <input
                      type="date"
                      value={fechaPrimerDescanso}
                      onChange={(e) => setFechaPrimerDescanso(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                    <span className="text-[10px] text-slate-400">
                      Calcula 10 días de descanso y 20 de trabajo de forma consecutiva
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                      Ciclos a Proyectar en el Año
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={cantidadCiclos}
                      onChange={(e) => setCantidadCiclos(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-sm transition"
              >
                <span>{modoEdicion ? 'Actualizar Colaborador' : 'Guardar y Calcular Turnos 20x10'}</span>
              </button>
            </div>
          </form>

          {/* Tabla de Trabajadores */}
          <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
            <div className="p-3 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Listado de Colaboradores Registrados ({trabajadores.length})</span>
              <button onClick={fetchTrabajadores} className="text-slate-500 hover:text-slate-800 p-1">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="p-3">Nombre</th>
                  <th className="p-3">Área</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trabajadores.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{t.nombres}</div>
                      <div className="text-[10px] text-slate-400">
                        {t._count?.descansosProgramados || 0} períodos programados base
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                        {t.area}
                      </span>
                    </td>
                    <td className="p-3">
                      {t.activo ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          <UserCheck className="w-3 h-3" />
                          <span>Activo</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                          <UserX className="w-3 h-3" />
                          <span>Dado de Baja</span>
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => handleIniciarEdicion(t)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
                        title="Editar Datos"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Editar</span>
                      </button>

                      <button
                        onClick={() => handleToggleBaja(t.id, t.activo)}
                        disabled={actionLoading === t.id}
                        className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg font-semibold text-xs transition disabled:opacity-50 ${
                          t.activo
                            ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {t.activo ? (
                          <>
                            <UserX className="w-3 h-3" />
                            <span>Dar de Baja</span>
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3 h-3" />
                            <span>Reactivar</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
