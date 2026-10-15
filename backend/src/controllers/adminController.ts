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

      if (!id || !estado || !Object.values(EstadoUsuario).includes(estado)) {
        res.status(400).json({
          success: false,
          error: 'Parámetros inválidos. Se requiere un estado válido (ACTIVO, PENDIENTE, RECHAZADO).',
        });
        return;
      }

      const usuarioActualizado = await prisma.usuario.update({
        where: { id },
        data: {
          estado,
          ...(rol && Object.values(RolUsuario).includes(rol) ? { rol } : {}),
          aprobadoEn: estado === EstadoUsuario.ACTIVO ? new Date() : null,
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
        message: `Usuario ${estado === EstadoUsuario.ACTIVO ? 'aprobado' : estado.toLowerCase()} correctamente.`,
      });
    } catch (error: any) {
      console.error('Error al cambiar estado de usuario:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
