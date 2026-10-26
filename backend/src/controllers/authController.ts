import { Request, Response } from 'express';
import { RolUsuario, EstadoUsuario } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { signToken } from '../middlewares/authMiddleware';
import { prisma } from '../prisma';

export class AuthController {
  public static async registro(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, nombres, username } = req.body;

      if (!email || !password || !nombres) {
        res.status(400).json({
          success: false,
          error: 'Todos los campos son requeridos (email, password, nombres).',
        });
        return;
      }

      const emailNormalizado = email.toLowerCase().trim();
      const usernameNormalizado = username ? username.trim() : null;

      const usuarioExiste = await prisma.usuario.findFirst({
        where: {
          OR: [
            { email: emailNormalizado },
            ...(usernameNormalizado ? [{ username: usernameNormalizado }] : []),
          ],
        },
      });

      if (usuarioExiste) {
        res.status(409).json({
          success: false,
          error: 'Ya existe una cuenta registrada con este correo o usuario.',
        });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);

      // Determinar rol asignado: si se solicita explícitamente o si el nombre/email indica secretaria/asistente
      let rolAsignado: RolUsuario = RolUsuario.SUPERVISOR;
      const rolSolicitado = req.body.rol;
      if (rolSolicitado && Object.values(RolUsuario).includes(rolSolicitado)) {
        rolAsignado = rolSolicitado as RolUsuario;
      } else if (
        nombres.toLowerCase().includes('secretaria') ||
        nombres.toLowerCase().includes('asistente') ||
        emailNormalizado.includes('secretaria') ||
        emailNormalizado.includes('asistente')
      ) {
        rolAsignado = RolUsuario.SECRETARIA;
      }

      const nuevoUsuario = await prisma.usuario.create({
        data: {
          email: emailNormalizado,
          username: usernameNormalizado,
          password: passwordHash,
          nombres: nombres.trim(),
          rol: rolAsignado,
          estado: EstadoUsuario.PENDIENTE,
        },
        select: {
          id: true,
          email: true,
          username: true,
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
      const identificador = (req.body.identificador || req.body.email || req.body.usuario || '').trim();
      const { password } = req.body;

      if (!identificador || !password) {
        res.status(400).json({
          success: false,
          error: 'Ingresa usuario o correo electrónico y contraseña.',
        });
        return;
      }

      const term = identificador;
      const termLower = identificador.toLowerCase();
      const emailEquivalente = termLower.includes('@') ? termLower : `${termLower}@tallermina.com`;

      const usuario = await prisma.usuario.findFirst({
        where: {
          OR: [
            { username: term },
            { username: termLower },
            { username: term.toUpperCase() },
            { email: termLower },
            { email: term },
            { email: emailEquivalente },
          ],
        },
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
        username: usuario.username,
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
            username: usuario.username,
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
          username: true,
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
