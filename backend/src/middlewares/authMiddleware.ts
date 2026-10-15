import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'taller_mina_super_secret_jwt_key_2026';

export interface AuthUserPayload {
  id: number;
  email: string;
  username?: string | null;
  nombres: string;
  rol: 'ADMIN' | 'SUPERVISOR' | 'TRABAJADOR';
  estado: 'PENDIENTE' | 'ACTIVO' | 'RECHAZADO';
}

declare global {
  namespace Express {
    interface Request {
      usuario?: AuthUserPayload;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Acceso no autorizado. Token no proporcionado.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUserPayload;

    if (decoded.estado !== 'ACTIVO') {
      res.status(403).json({
        success: false,
        error: 'Tu cuenta no está activa o se encuentra pendiente de aprobación.',
      });
      return;
    }

    req.usuario = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Token inválido o expirado.',
    });
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.usuario || req.usuario.rol !== 'ADMIN') {
    res.status(403).json({
      success: false,
      error: 'Acceso restringido: Se requieren permisos de Administrador.',
    });
    return;
  }
  next();
};

export const signToken = (user: AuthUserPayload): string => {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
};
