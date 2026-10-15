import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Usuario {
  id: number;
  email: string;
  username?: string | null;
  nombres: string;
  rol: 'ADMIN' | 'SUPERVISOR' | 'TRABAJADOR';
}

interface AuthContextType {
  usuario: Usuario | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, usuario: Usuario) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('mina_token');
    const savedUser = localStorage.getItem('mina_usuario');
    if (savedToken && savedUser) {
      try {
        const parts = savedToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          if (payload.exp && payload.exp * 1000 < Date.now()) {
            localStorage.removeItem('mina_token');
            localStorage.removeItem('mina_usuario');
            return;
          }
        }
        setToken(savedToken);
        setUsuario(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('mina_token');
        localStorage.removeItem('mina_usuario');
      }
    }

    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = (newToken: string, newUsuario: Usuario) => {
    setToken(newToken);
    setUsuario(newUsuario);
    localStorage.setItem('mina_token', newToken);
    localStorage.setItem('mina_usuario', JSON.stringify(newUsuario));
  };

  const logout = () => {
    setToken(null);
    setUsuario(null);
    localStorage.removeItem('mina_token');
    localStorage.removeItem('mina_usuario');
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        isAuthenticated: !!token && !!usuario,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
