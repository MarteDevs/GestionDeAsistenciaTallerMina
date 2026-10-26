import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'taller_mina_super_secret_jwt_key_2026';

export interface AuthUserPayload {
  id: number;
  email: string;
  username?: string | null;
  nombres: string;
  rol: 'ADMIN' | 'SUPERVISOR' | 'SECRETARIA' | 'TRABAJADOR';
  estado: 'PENDIENTE' | 'ACTIVO' | 'RECHAZADO';
}

declare global {
  namespace Express {
    interface Request {
      usuario?: AuthUserPayload;
    }
  }
}

import { prisma } from '../prisma';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

    // Verificar en tiempo real el estado activo del usuario en la base de datos
    const usuarioVivo = await prisma.usuario.findUnique({
      where: { id: decoded.id },
      select: { id: true, rol: true, estado: true, nombres: true, email: true, username: true },
    });

    if (!usuarioVivo || usuarioVivo.estado !== 'ACTIVO') {
      res.status(403).json({
        success: false,
        error: 'Tu cuenta ha sido desactivada, rechazada o no existe.',
      });
      return;
    }

    req.usuario = {
      id: usuarioVivo.id,
      email: usuarioVivo.email,
      username: usuarioVivo.username,
      nombres: usuarioVivo.nombres,
      rol: usuarioVivo.rol,
      estado: usuarioVivo.estado,
    };
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

export const requireSupervisorOrAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.usuario || (req.usuario.rol !== 'ADMIN' && req.usuario.rol !== 'SUPERVISOR')) {
    res.status(403).json({
      success: false,
      error: 'Acceso restringido: El rol de Secretaría / Asistente tiene permisos de solo visualización y exportación de reportes.',
    });
    return;
  }
  next();
};

export const signToken = (user: AuthUserPayload): string => {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
};
