import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GrillaProgramacion } from './components/GrillaProgramacion';
import { DashboardRelevos } from './components/DashboardRelevos';
import { AuthModal } from './components/AuthModal';
import { AdminUsuariosModal } from './components/AdminUsuariosModal';
import { GestionTrabajadoresModal } from './components/GestionTrabajadoresModal';
import { NotificationBell } from './components/NotificationBell';
import {
  Wrench,
  LogIn,
  LogOut,
  Layers,
  UserCheck,
  UserCog,
  LayoutDashboard,
  CalendarDays
} from 'lucide-react';

const AppContent: React.FC = () => {
  const { usuario, token, isAuthenticated, logout } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [gestionTrabajadoresOpen, setGestionTrabajadoresOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [vistaActiva, setVistaActiva] = useState<'dashboard' | 'planilla'>('dashboard');
  const [conteoAlertasHoy, setConteoAlertasHoy] = useState<number>(0);

  // Si el rol es SECRETARIA, fijar la vista directamente en planilla
  useEffect(() => {
    if (usuario?.rol === 'SECRETARIA') {
      setVistaActiva('planilla');
    }
  }, [usuario]);

  // Consultar alertas críticas de hoy para el badge del dock
  useEffect(() => {
    if (!token || !isAuthenticated) return;
    const cargarConteoHoy = async () => {
      try {
        const res = await fetch('/api/notificaciones/proximos-turnos?diasVentana=1', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          if (json.estadisticas) {
            setConteoAlertasHoy(json.estadisticas.hoy || 0);
          }
        }
      } catch (e) {
        // Ignorar de forma segura
      }
    };
    cargarConteoHoy();
  }, [token, isAuthenticated, refreshTrigger]);

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-800 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950 pb-20">
      {/* Top Header Navbar */}
      <header className="sticky top-0 z-40 bg-slate-950 text-white border-b border-slate-800/80 shadow-md backdrop-blur-md bg-opacity-95">
        <div className="max-w-[1700px] mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
          {/* Logo & Branding */}
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center font-black text-slate-950 shadow-md shadow-amber-500/20">
              <Wrench className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm font-black tracking-tight leading-none text-white">
                  TALLER MINA
                </h1>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  2026 - 2027
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                Gestión de Turnos, Proyección 30x10 y Excepciones Dinámicas
              </span>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center space-x-2.5">
            {/* Auth Buttons / User Profile */}
            {isAuthenticated && usuario ? (
              <div className="flex items-center space-x-2">
                {/* Notificaciones de Relevos / Turnos */}
                <NotificationBell />

                {/* Gestión de Personal (Solo Admin y Supervisor) */}
                {usuario.rol !== 'SECRETARIA' && usuario.rol !== 'TRABAJADOR' && (
                  <button
                    onClick={() => setGestionTrabajadoresOpen(true)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition"
                    title="Gestionar personal, altas, bajas y proyección 2027"
                  >
                    <UserCog className="w-4 h-4 text-amber-400" />
                    <span className="hidden sm:inline">Personal & Ciclos 30x10</span>
                  </button>
                )}

                {usuario.rol === 'ADMIN' && (
                  <button
                    onClick={() => setAdminModalOpen(true)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold text-xs transition"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span className="hidden md:inline">Aprobar Usuarios</span>
                  </button>
                )}

                <div className="flex items-center space-x-2 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="h-6 w-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold">
                    {usuario.nombres.charAt(0)}
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-bold leading-none">{usuario.nombres}</div>
                    <span className="text-[10px] text-slate-400 leading-none">{usuario.rol}</span>
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-white/5 transition"
                  title="Cerrar Sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition"
              >
                <LogIn className="w-4 h-4" />
                <span>Iniciar Sesión / Solicitar Cuenta</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-[1700px] mx-auto w-full p-3 sm:p-5 space-y-3">
        {!isAuthenticated ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="h-16 w-16 rounded-3xl bg-amber-500/20 text-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/10 mb-5">
              <LogIn className="w-8 h-8 stroke-[2.5]" />
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mb-2">
              Acceso Restringido al Personal Autorizado
            </h2>
            <p className="text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
              La planilla de turnos 30x10 y saldos de descansos de Mina contiene información confidencial de las operaciones de taller. Por favor inicia sesión con tu cuenta de supervisor o administrador para continuar.
            </p>
            <button
              onClick={() => setAuthModalOpen(true)}
              className="flex items-center space-x-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/30 transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <LogIn className="w-4 h-4 stroke-[2.5]" />
              <span>Iniciar Sesión en el Sistema</span>
            </button>
          </div>
        ) : (
          <>
            {/* Banner Informativo Superior */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-3.5 px-5 text-white border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold tracking-tight">PROGRAMACIÓN TALLER MINA (RÉGIMEN ATÍPICO 30x10)</h2>
                  <p className="text-[11px] text-slate-400">
                    {usuario?.rol === 'SECRETARIA'
                      ? 'Planilla oficial de turnos 30x10 y saldos de descansos. Vista oficial de consulta y exportación de reportes.'
                      : 'Las fechas base son inmutables. Haz clic sobre cualquier día para vender o registrar permisos en bloque (1 a 5 días).'}
                  </p>
                </div>
              </div>
              {usuario?.rol !== 'SECRETARIA' && usuario?.rol !== 'TRABAJADOR' && (
                <div className="flex items-center space-x-2 text-xs">
                  <button
                    onClick={() => setGestionTrabajadoresOpen(true)}
                    className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-semibold transition"
                  >
                    + Gestionar Personal / Proyectar 2027
                  </button>
                </div>
              )}
            </div>

            {/* Vistas Alternables */}
            {vistaActiva === 'dashboard' && usuario?.rol !== 'SECRETARIA' ? (
              <DashboardRelevos onVerPlanilla={() => setVistaActiva('planilla')} />
            ) : (
              <GrillaProgramacion refreshTrigger={refreshTrigger} />
            )}
          </>
        )}
      </main>

      {/* Moderno Navbar Dock Flotante (Inferior Izquierda / Centrado en móviles) */}
      {isAuthenticated && usuario?.rol !== 'SECRETARIA' && (
        <nav
          aria-label="Navegación principal"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 sm:bottom-6 sm:left-6 sm:translate-x-0 z-40 bg-slate-950/95 text-white rounded-2xl p-1.5 shadow-2xl border border-slate-800 backdrop-blur-md flex items-center space-x-1.5 transition-all duration-200"
        >
          {/* Botón Dashboard */}
          <button
            onClick={() => setVistaActiva('dashboard')}
            className={`relative flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
              vistaActiva === 'dashboard'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard Relevos</span>

            {/* Badge sutil de alertas si hay eventos hoy */}
            {conteoAlertasHoy > 0 && (
              <span
                className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-black leading-none ${
                  vistaActiva === 'dashboard'
                    ? 'bg-slate-950 text-amber-400 ring-1 ring-amber-400/30'
                    : 'bg-rose-500 text-white animate-pulse'
                }`}
                title={`${conteoAlertasHoy} movimientos hoy`}
              >
                {conteoAlertasHoy}
              </span>
            )}
          </button>

          {/* Separador */}
          <div className="w-[1px] h-5 bg-slate-800"></div>

          {/* Botón Planilla Mensual 30x10 */}
          <button
            onClick={() => setVistaActiva('planilla')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
              vistaActiva === 'planilla'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>Planilla 30x10</span>
          </button>
        </nav>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-500">
        &copy; 2026 - 2027 Taller Mina - Sistema de Turnos Inmutables, Asistencia y Excepciones Dinámicas
      </footer>

      {/* Modales */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      <AdminUsuariosModal isOpen={adminModalOpen} onClose={() => setAdminModalOpen(false)} />
      <GestionTrabajadoresModal
        isOpen={gestionTrabajadoresOpen}
        onClose={() => setGestionTrabajadoresOpen(false)}
        onTrabajadoresActualizados={() => setRefreshTrigger((prev) => prev + 1)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
