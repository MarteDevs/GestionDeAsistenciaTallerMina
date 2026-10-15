import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { ProgramacionService } from '../services/programacionService';

export interface EventoTurnoProximo {
  id: string;
  tipo: 'INICIO_DESCANSO' | 'FIN_DESCANSO' | 'VENTA_ACTIVA' | 'PERMISO_ACTIVO';
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

      const hoy = fechaRefQuery
        ? new Date(`${fechaRefQuery}T00:00:00.000Z`)
        : new Date();

      const hoyUtc = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate()));
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

        // Revisar cada descanso
        for (const dp of t.descansosProgramados) {
          const fiStr = ProgramacionService.formatFechaIso(new Date(dp.fechaInicio));
          const ffStr = ProgramacionService.formatFechaIso(new Date(dp.fechaFin));
          const fiDate = new Date(dp.fechaInicio);
          const ffDate = new Date(dp.fechaFin);

          // Evento A: Inicio de descanso (Salida de mina a descanso libre)
          if (fiDate >= hoyUtc && fiDate <= limiteUtc) {
            const diffDias = Math.round((fiDate.getTime() - hoyUtc.getTime()) / (1000 * 60 * 60 * 24));
            eventos.push({
              id: `descanso-inicio-${t.id}-${fiStr}`,
              tipo: 'INICIO_DESCANSO',
              trabajadorId: t.id,
              nombres: t.nombres,
              area: t.area,
              fechaEvento: fiStr,
              diasRestantes: diffDias,
              descripcion: diffDias === 0
                ? `${t.nombres} inicia hoy su descanso programado (${dp.cantidadDias} días).`
                : `${t.nombres} inicia descanso en ${diffDias} ${diffDias === 1 ? 'día' : 'días'} (${fiStr}).`,
              detalle: {
                fechaInicio: fiStr,
                fechaFin: ffStr,
                cantidadDias: dp.cantidadDias,
              },
            });
          }

          // Evento B: Fin de descanso (Reincorporación / Subida a mina al día siguiente del fin)
          if (ffDate >= hoyUtc && ffDate <= limiteUtc) {
            const diffDias = Math.round((ffDate.getTime() - hoyUtc.getTime()) / (1000 * 60 * 60 * 24));
            const subidaDate = new Date(ffDate.getTime() + 24 * 60 * 60 * 1000);
            const subidaStr = ProgramacionService.formatFechaIso(subidaDate);

            eventos.push({
              id: `descanso-fin-${t.id}-${ffStr}`,
              tipo: 'FIN_DESCANSO',
              trabajadorId: t.id,
              nombres: t.nombres,
              area: t.area,
              fechaEvento: ffStr,
              diasRestantes: diffDias,
              descripcion: diffDias === 0
                ? `${t.nombres} termina hoy su descanso. Reincorporación mañana ${subidaStr}.`
                : `${t.nombres} termina descanso en ${diffDias} ${diffDias === 1 ? 'día' : 'días'}. Reincorporación el ${subidaStr}.`,
              detalle: {
                fechaInicio: fiStr,
                fechaFin: ffStr,
                cantidadDias: dp.cantidadDias,
              },
            });
          }
        }

        // Evento C: Excepciones activas o próximas (Ventas de descanso o Permisos)
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

      // Ordenar cronológicamente por días restantes y fecha
      eventos.sort((a, b) => a.diasRestantes - b.diasRestantes);

      // Estadísticas rápidas para badges
      const estadisticas = {
        totalEventos: eventos.length,
        hoy: eventos.filter((e) => e.diasRestantes === 0).length,
        proximos3Dias: eventos.filter((e) => e.diasRestantes > 0 && e.diasRestantes <= 3).length,
        iniciosDescanso: eventos.filter((e) => e.tipo === 'INICIO_DESCANSO').length,
        finesDescanso: eventos.filter((e) => e.tipo === 'FIN_DESCANSO').length,
        ventas: eventos.filter((e) => e.tipo === 'VENTA_ACTIVA').length,
      };

      res.json({
        success: true,
        fechaReferencia: fechaHoyStr,
        diasVentana,
        estadisticas,
        data: eventos,
      });
    } catch (error: any) {
      console.error('Error al obtener notificaciones de turnos próximos:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
