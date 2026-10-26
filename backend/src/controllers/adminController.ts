import { Request, Response } from 'express';
import { EstadoUsuario, RolUsuario } from '@prisma/client';
import { prisma } from '../prisma';

export class AdminController {
  public static async listarUsuarios(req: Request, res: Response): Promise<void> {
    try {
      const usuarios = await prisma.usuario.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          username: true,
          nombres: true,
          rol: true,
          estado: true,
          aprobadoEn: true,
          createdAt: true,
        },
      });

      res.json({
        success: true,
        data: usuarios,
      });
    } catch (error: any) {
      console.error('Error al listar usuarios:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  public static async cambiarEstadoUsuario(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const { estado, rol } = req.body;

      if (!id || (!estado && !rol)) {
        res.status(400).json({
          success: false,
          error: 'Parámetros inválidos. Se requiere estado o rol.',
        });
        return;
      }

      if (estado && !Object.values(EstadoUsuario).includes(estado)) {
        res.status(400).json({
          success: false,
          error: 'Estado inválido (ACTIVO, PENDIENTE, RECHAZADO).',
        });
        return;
      }

      if (rol && !Object.values(RolUsuario).includes(rol)) {
        res.status(400).json({
          success: false,
          error: 'Rol inválido (ADMIN, SUPERVISOR, SECRETARIA, TRABAJADOR).',
        });
        return;
      }

      const usuarioActualizado = await prisma.usuario.update({
        where: { id },
        data: {
          ...(estado ? { estado } : {}),
          ...(rol ? { rol } : {}),
          ...(estado === EstadoUsuario.ACTIVO ? { aprobadoEn: new Date() } : {}),
        },
        select: {
          id: true,
          email: true,
          username: true,
          nombres: true,
          rol: true,
          estado: true,
          aprobadoEn: true,
        },
      });

      res.json({
        success: true,
        data: usuarioActualizado,
        message: 'Usuario actualizado correctamente.',
      });
    } catch (error: any) {
      console.error('Error al cambiar estado o rol de usuario:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
