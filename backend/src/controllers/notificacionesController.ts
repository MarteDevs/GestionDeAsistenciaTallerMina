import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { ProgramacionService } from '../services/programacionService';

export interface EventoTurnoProximo {
  id: string;
  tipo: 'EN_DESCANSO' | 'INICIO_DESCANSO' | 'FIN_DESCANSO' | 'VENTA_ACTIVA' | 'PERMISO_ACTIVA' | 'PERMISO_ACTIVO';
  trabajadorId: number;
  nombres: string;
  area: string;
  fechaEvento: string;       // YYYY-MM-DD
  diasRestantes: number;     // 0 = hoy, 1 = mañana, etc.
  descripcion: string;
  detalle: {
    fechaInicio?: string;
    fechaFin?: string;
    cantidadDias?: number;
    motivo?: string | null;
  };
}

export class NotificacionesController {
  /**
   * GET /api/notificaciones/proximos-turnos
   * Parámetros query:
   *  - fechaReferencia: YYYY-MM-DD (opcional, por defecto fecha actual local/UTC)
   *  - diasVentana: número de días hacia adelante para anticipar alertas (por defecto 7)
   */
  public static async obtenerProximosTurnos(req: Request, res: Response): Promise<void> {
    try {
      const fechaRefQuery = req.query.fechaReferencia as string;
      const diasVentana = parseInt(req.query.diasVentana as string) || 7;

      const fechaPeru = ProgramacionService.getFechaHoyPeru();
      const hoyUtc = fechaRefQuery
        ? new Date(`${fechaRefQuery}T00:00:00.000Z`)
        : fechaPeru.dateUtc;

      const limiteUtc = new Date(hoyUtc.getTime() + diasVentana * 24 * 60 * 60 * 1000);
      const fechaHoyStr = ProgramacionService.formatFechaIso(hoyUtc);

      // 1. Obtener todos los trabajadores activos con sus descansos y excepciones en la ventana
      const trabajadores = await prisma.trabajador.findMany({
        where: { activo: true },
        include: {
          descansosProgramados: {
            where: {
              OR: [
                // Inicios de descanso dentro de la ventana
                { fechaInicio: { gte: hoyUtc, lte: limiteUtc } },
                // Fines de descanso dentro de la ventana
                { fechaFin: { gte: hoyUtc, lte: limiteUtc } },
                // O descansos que están en curso actualmente
                { fechaInicio: { lte: hoyUtc }, fechaFin: { gte: hoyUtc } },
              ],
            },
            orderBy: { fechaInicio: 'asc' },
          },
          excepciones: {
            where: {
              fecha: { gte: hoyUtc, lte: limiteUtc },
            },
          },
        },
        orderBy: { nombres: 'asc' },
      });

      const eventos: EventoTurnoProximo[] = [];

      for (const t of trabajadores) {
        // Excepciones mapeadas por fecha
        const excepcionesMap = new Map<string, { tipo: string; motivo: string | null }>();
        t.excepciones.forEach((e) => {
          excepcionesMap.set(ProgramacionService.formatFechaIso(new Date(e.fecha)), {
            tipo: e.tipo,
            motivo: e.motivo,
          });
        });

        // Revisar cada descanso programado de forma clara y sin duplicados
        for (const dp of t.descansosProgramados) {
          const fiStr = ProgramacionService.formatFechaIso(new Date(dp.fechaInicio));
          const ffStr = ProgramacionService.formatFechaIso(new Date(dp.fechaFin));
          const fiDate = new Date(dp.fechaInicio);
          const ffDate = new Date(dp.fechaFin);

          // CASO 1: El colaborador se encuentra ACTUALMENTE en descanso hoy
          if (fiDate <= hoyUtc && ffDate >= hoyUtc) {
            const excepcionHoy = excepcionesMap.get(fechaHoyStr);
            if (excepcionHoy && excepcionHoy.tipo === 'VENTA_DESCANSO') {
              // El colaborador vendió este día de descanso y está laborando activamente hoy.
              // Evitamos emitir alerta contradictoria de descanso para hoy, ya que CASO 3 reporta VENTA_ACTIVA.
              continue;
            }

            const diasParaFin = Math.round((ffDate.getTime() - hoyUtc.getTime()) / (1000 * 60 * 60 * 24));
            const subidaDate = new Date(ffDate.getTime() + 24 * 60 * 60 * 1000);
            const subidaStr = ProgramacionService.formatFechaIso(subidaDate);

            eventos.push({
              id: `descanso-activo-${t.id}-${fiStr}`,
              tipo: 'EN_DESCANSO',
              trabajadorId: t.id,
              nombres: t.nombres,
              area: t.area,
              fechaEvento: ffStr,
              diasRestantes: diasParaFin,
              descripcion: diasParaFin === 0
                ? `${t.nombres} culmina hoy su descanso. Retorna al taller mañana (${subidaStr}).`
                : diasParaFin === 1
                ? `${t.nombres} está en descanso (último día). Retorna al taller el ${subidaStr}.`
                : `${t.nombres} se encuentra en descanso (le quedan ${diasParaFin} días). Retorna al taller el ${subidaStr}.`,
              detalle: {
                fechaInicio: fiStr,
                fechaFin: ffStr,
                cantidadDias: dp.cantidadDias,
              },
            });
            continue; // Evita generar un segundo evento redundante para el mismo descanso
          }

          // CASO 2: El colaborador está en mina y su descanso INICIA en los próximos días de la ventana
          if (fiDate > hoyUtc && fiDate <= limiteUtc) {
            const diffDias = Math.round((fiDate.getTime() - hoyUtc.getTime()) / (1000 * 60 * 60 * 24));
            eventos.push({
              id: `descanso-inicio-${t.id}-${fiStr}`,
              tipo: 'INICIO_DESCANSO',
              trabajadorId: t.id,
              nombres: t.nombres,
              area: t.area,
              fechaEvento: fiStr,
              diasRestantes: diffDias,
              descripcion: diffDias === 1
                ? `${t.nombres} culmina guardia en mina y baja a descanso mañana (${fiStr}).`
                : `${t.nombres} culmina guardia y baja a descanso en ${diffDias} días (${fiStr}).`,
              detalle: {
                fechaInicio: fiStr,
                fechaFin: ffStr,
                cantidadDias: dp.cantidadDias,
              },
            });
          }
        }

        // CASO 3: Excepciones activas o próximas (Ventas de descanso o Permisos)
        for (const exc of t.excepciones) {
          const excFechaStr = ProgramacionService.formatFechaIso(new Date(exc.fecha));
          const excDate = new Date(exc.fecha);
          const diffDias = Math.round((excDate.getTime() - hoyUtc.getTime()) / (1000 * 60 * 60 * 24));

          if (exc.tipo === 'VENTA_DESCANSO') {
            eventos.push({
              id: `venta-${t.id}-${excFechaStr}`,
              tipo: 'VENTA_ACTIVA',
              trabajadorId: t.id,
              nombres: t.nombres,
              area: t.area,
              fechaEvento: excFechaStr,
              diasRestantes: diffDias,
              descripcion: diffDias === 0
                ? `${t.nombres} tiene venta de descanso activa hoy (${excFechaStr}).`
                : `${t.nombres} tiene venta de descanso en ${diffDias} días (${excFechaStr}).`,
              detalle: {
                fechaInicio: excFechaStr,
                motivo: exc.motivo,
              },
            });
          } else if (exc.tipo === 'PERMISO') {
            eventos.push({
              id: `permiso-${t.id}-${excFechaStr}`,
              tipo: 'PERMISO_ACTIVO',
              trabajadorId: t.id,
              nombres: t.nombres,
              area: t.area,
              fechaEvento: excFechaStr,
              diasRestantes: diffDias,
              descripcion: diffDias === 0
                ? `${t.nombres} tiene permiso programado hoy (${excFechaStr}).`
                : `${t.nombres} tiene permiso en ${diffDias} días (${excFechaStr}).`,
              detalle: {
                fechaInicio: excFechaStr,
                motivo: exc.motivo,
              },
            });
          }
        }
      }

      // Ordenar cronológicamente por días restantes y nombre
      eventos.sort((a, b) => a.diasRestantes - b.diasRestantes || a.nombres.localeCompare(b.nombres));

      // Obtener lista de notificaciones descartadas para el usuario actual
      let descartadas: string[] = [];
      const usuarioId = req.usuario?.id;
      if (usuarioId) {
        await NotificacionesController.asegurarTablaDescartadas();
        const rows: any[] = await prisma.$queryRawUnsafe(
          `SELECT notificacion_id FROM notificaciones_descartadas WHERE usuario_id = ?`,
          usuarioId
        );
        descartadas = rows.map((r: any) => r.notificacion_id);
      }

      // Estadísticas rápidas para badges
      const estadisticas = {
        totalEventos: eventos.length,
        hoy: eventos.filter((e) => e.diasRestantes === 0).length,
        proximos3Dias: eventos.filter((e) => e.diasRestantes > 0 && e.diasRestantes <= 3).length,
        iniciosDescanso: eventos.filter((e) => e.tipo === 'INICIO_DESCANSO').length,
        finesDescanso: eventos.filter((e) => e.tipo === 'EN_DESCANSO').length,
        ventas: eventos.filter((e) => e.tipo === 'VENTA_ACTIVA').length,
      };

      res.json({
        success: true,
        fechaReferencia: fechaHoyStr,
        diasVentana,
        estadisticas,
        descartadas,
        data: eventos,
      });
    } catch (error: any) {
      console.error('Error al obtener notificaciones de turnos próximos:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Garantiza que la tabla de notificaciones descartadas exista en MySQL
   */
  private static async asegurarTablaDescartadas(): Promise<void> {
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS notificaciones_descartadas (
          id INT AUTO_INCREMENT PRIMARY KEY,
          usuario_id INT NOT NULL,
          notificacion_id VARCHAR(150) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uq_user_notif (usuario_id, notificacion_id),
          INDEX idx_user (usuario_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
    } catch (e) {
      console.error('Error al asegurar tabla notificaciones_descartadas:', e);
    }
  }

  /**
   * POST /api/notificaciones/descartar
   * Body: { ids?: string[], id?: string }
   */
  public static async descartarNotificaciones(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId = req.usuario?.id;
      if (!usuarioId) {
        res.status(401).json({ success: false, error: 'Usuario no identificado' });
        return;
      }

      await NotificacionesController.asegurarTablaDescartadas();

      const { ids, id } = req.body;
      const idsADescartar: string[] = Array.isArray(ids) ? ids : id ? [id] : [];

      if (idsADescartar.length === 0) {
        res.json({ success: true, descartadasCount: 0 });
        return;
      }

      for (const notifId of idsADescartar) {
        await prisma.$executeRawUnsafe(
          `INSERT IGNORE INTO notificaciones_descartadas (usuario_id, notificacion_id) VALUES (?, ?)`,
          usuarioId,
          notifId
        );
      }

      res.json({ success: true, descartadasCount: idsADescartar.length });
    } catch (error: any) {
      console.error('Error descartando notificaciones:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/notificaciones/restaurar
   * Limpia las notificaciones descartadas para el usuario actual
   */
  public static async restaurarNotificaciones(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId = req.usuario?.id;
      if (!usuarioId) {
        res.status(401).json({ success: false, error: 'Usuario no identificado' });
        return;
      }

      await NotificacionesController.asegurarTablaDescartadas();
      await prisma.$executeRawUnsafe(
        `DELETE FROM notificaciones_descartadas WHERE usuario_id = ?`,
        usuarioId
      );

      res.json({ success: true, message: 'Notificaciones restauradas exitosamente' });
    } catch (error: any) {
      console.error('Error restaurando notificaciones:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
