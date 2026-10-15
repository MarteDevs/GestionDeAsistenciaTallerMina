import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, CheckCircle, XCircle, Clock, ShieldCheck, RefreshCw } from 'lucide-react';

interface UsuarioAdmin {
  id: number;
  email: string;
  username?: string | null;
  nombres: string;
  rol: 'ADMIN' | 'SUPERVISOR' | 'TRABAJADOR';
  estado: 'PENDIENTE' | 'ACTIVO' | 'RECHAZADO';
  createdAt: string;
}

interface AdminUsuariosModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminUsuariosModal: React.FC<AdminUsuariosModalProps> = ({ isOpen, onClose }) => {
  const { token } = useAuth();
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchUsuarios = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/usuarios', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setUsuarios(data.data);
      }
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsuarios();
    }
  }, [isOpen, token]);

  const handleCambiarEstado = async (id: number, nuevoEstado: 'ACTIVO' | 'RECHAZADO') => {
    if (!token) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/usuarios/${id}/estado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      const data = await res.json();
      if (data.success) {
        setUsuarios((prev) =>
          prev.map((u) => (u.id === id ? { ...u, estado: nuevoEstado } : u))
        );
      }
    } catch (err) {
      console.error('Error al actualizar estado:', err);
    } finally {
      setActionLoading(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 p-6 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight">Gestión y Aprobación de Usuarios</h3>
              <p className="text-xs text-slate-300">
                Valida solicitudes pendientes y gestiona accesos al sistema.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchUsuarios}
              disabled={loading}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition"
              title="Recargar lista"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition text-lg leading-none"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Content Table */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="py-12 text-center text-slate-500 text-sm">Cargando usuarios...</div>
          ) : usuarios.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">No hay usuarios registrados.</div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="p-3">Usuario</th>
                    <th className="p-3">Rol</th>
                    <th className="p-3">Estado Actual</th>
                    <th className="p-3 text-right">Acciones de Validación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usuarios.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3">
                        <div className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                          <span>{u.nombres}</span>
                          {u.username && (
                            <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              @{u.username}
                            </span>
                          )}
                        </div>
                        <div className="text-slate-500">{u.email}</div>
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                          {u.rol}
                        </span>
                      </td>
                      <td className="p-3">
                        {u.estado === 'ACTIVO' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Activo</span>
                          </span>
                        )}
                        {u.estado === 'PENDIENTE' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 animate-pulse">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Pendiente</span>
                          </span>
                        )}
                        {u.estado === 'RECHAZADO' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Rechazado</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right space-x-2">
                        {u.estado !== 'ACTIVO' && (
                          <button
                            onClick={() => handleCambiarEstado(u.id, 'ACTIVO')}
                            disabled={actionLoading === u.id}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition shadow-sm disabled:opacity-50"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Aprobar</span>
                          </button>
                        )}
                        {u.estado !== 'RECHAZADO' && (
                          <button
                            onClick={() => handleCambiarEstado(u.id, 'RECHAZADO')}
                            disabled={actionLoading === u.id}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs border border-rose-200 transition disabled:opacity-50"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Rechazar</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
