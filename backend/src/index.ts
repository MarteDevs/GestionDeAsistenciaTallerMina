import dotenv from 'dotenv';
dotenv.config();

import express, { Application } from 'express';
import cors from 'cors';
import { getDatabaseUrl } from './prisma';
import { ProgramacionController } from './controllers/programacionController';
import { AuthController } from './controllers/authController';
import { AdminController } from './controllers/adminController';
import { TrabajadorController } from './controllers/trabajadorController';
import { NotificacionesController } from './controllers/notificacionesController';
import { authMiddleware, requireAdmin } from './middlewares/authMiddleware';

getDatabaseUrl();

const app: Application = express();
const PORT = Number(process.env.PORT) || 9005;
const HOST = process.env.HOST || '127.0.0.1';

app.use(cors());
app.use(express.json());

// 1. Autenticación
app.post('/api/auth/registro', AuthController.registro);
app.post('/api/auth/login', AuthController.login);
app.get('/api/auth/perfil', authMiddleware, AuthController.perfil);

// 2. Programación y Excepciones
app.get('/api/programacion', ProgramacionController.getGrilla);
app.get('/api/programacion/bloque-descanso', ProgramacionController.getDetalleBloqueDescanso);
app.post('/api/excepciones', authMiddleware, ProgramacionController.crearExcepcion);
app.post('/api/excepciones/rango', authMiddleware, TrabajadorController.registrarExcepcionesRango);

// 3. Gestión de Trabajadores y Proyección 20x10
app.get('/api/trabajadores', authMiddleware, TrabajadorController.listar);
app.post('/api/trabajadores', authMiddleware, requireAdmin, TrabajadorController.crear);
app.put('/api/trabajadores/:id', authMiddleware, requireAdmin, TrabajadorController.actualizar);
app.put('/api/trabajadores/:id/baja', authMiddleware, requireAdmin, TrabajadorController.toggleBaja);
app.post('/api/trabajadores/proyectar-anio', authMiddleware, requireAdmin, TrabajadorController.proyectarSiguienteAnio);

// 4. Administración de Usuarios
app.get('/api/admin/usuarios', authMiddleware, requireAdmin, AdminController.listarUsuarios);
app.put('/api/admin/usuarios/:id/estado', authMiddleware, requireAdmin, AdminController.cambiarEstadoUsuario);

// 5. Notificaciones y Próximos Turnos (Web & Android)
app.get('/api/notificaciones/proximos-turnos', authMiddleware, NotificacionesController.obtenerProximosTurnos);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Taller Carpinteria Mina API',
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, HOST, () => {
  console.log(`[BACKEND] Servidor corriendo en http://${HOST}:${PORT}`);
});
