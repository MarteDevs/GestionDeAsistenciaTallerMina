import { Request, Response } from 'express';
import { RolUsuario, EstadoUsuario } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { signToken } from '../middlewares/authMiddleware';
import { prisma } from '../prisma';

export class AuthController {
  public static async registro(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, nombres } = req.body;

      if (!email || !password || !nombres) {
        res.status(400).json({
          success: false,
          error: 'Todos los campos son requeridos (email, password, nombres).',
        });
        return;
      }

      const emailNormalizado = email.toLowerCase().trim();

      const usuarioExiste = await prisma.usuario.findUnique({
        where: { email: emailNormalizado },
      });

      if (usuarioExiste) {
        res.status(409).json({
          success: false,
          error: 'Ya existe una cuenta registrada con este correo electrónico.',
        });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const nuevoUsuario = await prisma.usuario.create({
        data: {
          email: emailNormalizado,
          password: passwordHash,
          nombres: nombres.trim(),
          rol: RolUsuario.SUPERVISOR,
          estado: EstadoUsuario.PENDIENTE,
        },
        select: {
          id: true,
          email: true,
          nombres: true,
          rol: true,
          estado: true,
          createdAt: true,
        },
      });

      res.status(201).json({
        success: true,
        data: nuevoUsuario,
        message: 'Tu cuenta ha sido creada exitosamente. Un administrador debe aprobar tu acceso antes de que puedas iniciar sesión.',
      });
    } catch (error: any) {
      console.error('Error en registro:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al procesar el registro.',
      });
    }
  }

  public static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'Ingresa correo y contraseña.',
        });
        return;
      }

      const emailNormalizado = email.toLowerCase().trim();

      const usuario = await prisma.usuario.findUnique({
        where: { email: emailNormalizado },
      });

      if (!usuario) {
        res.status(401).json({
          success: false,
          error: 'Credenciales inválidas.',
        });
        return;
      }

      const passwordValido = await bcrypt.compare(password, usuario.password);
      if (!passwordValido) {
        res.status(401).json({
          success: false,
          error: 'Credenciales inválidas.',
        });
        return;
      }

      if (usuario.estado === EstadoUsuario.PENDIENTE) {
        res.status(403).json({
          success: false,
          error: 'Tu solicitud de acceso aún está PENDIENTE de aprobación por parte del Administrador.',
          estado: 'PENDIENTE',
        });
        return;
      }

      if (usuario.estado === EstadoUsuario.RECHAZADO) {
        res.status(403).json({
          success: false,
          error: 'Tu solicitud de cuenta ha sido rechazada por el Administrador.',
          estado: 'RECHAZADO',
        });
        return;
      }

      const token = signToken({
        id: usuario.id,
        email: usuario.email,
        nombres: usuario.nombres,
        rol: usuario.rol,
        estado: usuario.estado,
      });

      res.json({
        success: true,
        data: {
          token,
          usuario: {
            id: usuario.id,
            email: usuario.email,
            nombres: usuario.nombres,
            rol: usuario.rol,
          },
        },
        message: 'Sesión iniciada correctamente.',
      });
    } catch (error: any) {
      console.error('Error en login:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al iniciar sesión.',
      });
    }
  }

  public static async perfil(req: Request, res: Response): Promise<void> {
    try {
      if (!req.usuario) {
        res.status(401).json({ success: false, error: 'No autenticado.' });
        return;
      }

      const usuario = await prisma.usuario.findUnique({
        where: { id: req.usuario.id },
        select: {
          id: true,
          email: true,
          nombres: true,
          rol: true,
          estado: true,
          createdAt: true,
        },
      });

      res.json({ success: true, data: usuario });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
