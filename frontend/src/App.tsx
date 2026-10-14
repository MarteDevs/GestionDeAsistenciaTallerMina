import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GrillaProgramacion } from './components/GrillaProgramacion';
import { AuthModal } from './components/AuthModal';
import { AdminUsuariosModal } from './components/AdminUsuariosModal';
import { GestionTrabajadoresModal } from './components/GestionTrabajadoresModal';
import { NotificationBell } from './components/NotificationBell';
import {
  Wrench,
  LogIn,
  LogOut,
  Layers,
  Database,
  UserCheck,
  UserCog
} from 'lucide-react';

const AppContent: React.FC = () => {
  const { usuario, isAuthenticated, logout } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [gestionTrabajadoresOpen, setGestionTrabajadoresOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-800 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
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
                  TALLER CARPINTERÍA
                </h1>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  2026 - 2027
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                Gestión de Turnos, Proyección 20x10 y Excepciones Dinámicas
              </span>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center space-x-2.5">
            <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>MySQL 3306</span>
            </div>

            {/* Auth Buttons / User Profile */}
            {isAuthenticated && usuario ? (
              <div className="flex items-center space-x-2">
                {/* Notificaciones de Relevos / Turnos */}
                <NotificationBell />

                {/* Gestión de Personal */}
                <button
                  onClick={() => setGestionTrabajadoresOpen(true)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition"
                  title="Gestionar personal, altas, bajas y proyección 2027"
                >
                  <UserCog className="w-4 h-4 text-amber-400" />
                  <span>Personal & Ciclos 20x10</span>
                </button>

                {usuario.rol === 'ADMIN' && (
                  <button
                    onClick={() => setAdminModalOpen(true)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold text-xs transition"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Aprobar Usuarios</span>
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
        {/* Banner Informativo */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-3.5 px-5 text-white border border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold tracking-tight">PROGRAMACIÓN TALLER CARPINTERÍA (RÉGIMEN ATÍPICO 20x10)</h2>
              <p className="text-[11px] text-slate-400">
                Las fechas base son inmutables. Haz clic sobre cualquier día para vender o registrar permisos en bloque (1 a 5 días).
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <button
              onClick={() => {
                if (!isAuthenticated) setAuthModalOpen(true);
                else setGestionTrabajadoresOpen(true);
              }}
              className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-semibold transition"
            >
              + Gestionar Personal / Proyectar 2027
            </button>
          </div>
        </div>

        {/* Grilla Principal */}
        <GrillaProgramacion refreshTrigger={refreshTrigger} />
      </main>

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
