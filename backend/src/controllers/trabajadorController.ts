import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { ProgramacionService } from '../services/programacionService';

export class TrabajadorController {
  public static async listar(req: Request, res: Response): Promise<void> {
    try {
      const { incluirInactivos } = req.query;
      const where = incluirInactivos === 'true' ? {} : { activo: true };

      const trabajadores = await prisma.trabajador.findMany({
        where,
        orderBy: { nombres: 'asc' },
        include: {
          descansosProgramados: {
            orderBy: { fechaInicio: 'asc' },
          },
          _count: {
            select: { descansosProgramados: true, excepciones: true },
          },
        },
      });

      res.json({ success: true, data: trabajadores });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  public static async crear(req: Request, res: Response): Promise<void> {
    try {
      const {
        nombres,
        area,
        fechaInicioTrabajo,
        diasDescanso = 10,
        diasTrabajo = 30,
      } = req.body;

      if (!nombres || !area) {
        res.status(400).json({ success: false, error: 'Nombres y Área son obligatorios.' });
        return;
      }

      const nuevoTrabajador = await prisma.$transaction(async (tx) => {
        const trabajador = await tx.trabajador.create({
          data: {
            nombres: nombres.trim().toUpperCase(),
            area: area.trim(),
            activo: true,
          },
        });

        if (fechaInicioTrabajo) {
          const cantDescanso = parseInt(diasDescanso) || 10;
          const cantTrabajo = parseInt(diasTrabajo) || 30;

          const inicioTrabajo = new Date(`${String(fechaInicioTrabajo).split('T')[0]}T00:00:00.000Z`);
          const anioLimite = inicioTrabajo.getUTCFullYear();

          let fi = new Date(inicioTrabajo.getTime() + cantTrabajo * 24 * 60 * 60 * 1000);
          const descansosData: Array<{
            trabajadorId: number;
            fechaInicio: Date;
            fechaFin: Date;
            cantidadDias: number;
          }> = [];

          while (fi.getUTCFullYear() <= anioLimite) {
            const ff = new Date(fi.getTime() + (cantDescanso - 1) * 24 * 60 * 60 * 1000);

            descansosData.push({
              trabajadorId: trabajador.id,
              fechaInicio: fi,
              fechaFin: ff,
              cantidadDias: cantDescanso,
            });

            fi = new Date(ff.getTime() + (cantTrabajo + 1) * 24 * 60 * 60 * 1000);
          }

          if (descansosData.length > 0) {
            await tx.descansoProgramado.createMany({
              data: descansosData,
            });
          }
        }

        return trabajador;
      });

      res.status(201).json({
        success: true,
        data: nuevoTrabajador,
        message: 'Trabajador registrado y cronograma calculado a partir de su inicio laboral.',
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  public static async actualizar(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const { nombres, area, activo } = req.body;

      const trabajador = await prisma.trabajador.update({
        where: { id },
        data: {
          ...(nombres ? { nombres: nombres.trim().toUpperCase() } : {}),
          ...(area ? { area: area.trim() } : {}),
          ...(typeof activo === 'boolean' ? { activo } : {}),
        },
      });

      res.json({ success: true, data: trabajador, message: 'Datos actualizados correctamente.' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  public static async toggleBaja(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const { activo } = req.body;

      const trabajador = await prisma.trabajador.update({
        where: { id },
        data: { activo },
      });

      res.json({
        success: true,
        data: trabajador,
        message: `Trabajador ${activo ? 'activado' : 'dado de baja'} correctamente.`,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  public static async proyectarSiguienteAnio(req: Request, res: Response): Promise<void> {
    try {
      const { anioDestino } = req.body;
      const targetYear = parseInt(anioDestino) || 2027;

      const generados = await prisma.$transaction(async (tx) => {
        const trabajadores = await tx.trabajador.findMany({
          where: { activo: true },
          include: {
            descansosProgramados: {
              orderBy: { fechaFin: 'desc' },
              take: 1,
            },
          },
        });

        let total = 0;
        const descansosBatch: Array<{
          trabajadorId: number;
          fechaInicio: Date;
          fechaFin: Date;
          cantidadDias: number;
        }> = [];

        for (const t of trabajadores) {
          if (t.descansosProgramados.length === 0) continue;

          const ultimoDescanso = t.descansosProgramados[0];
          const cantDiasDescanso = ultimoDescanso.cantidadDias || 10;
          
          let proximaFi = new Date(ultimoDescanso.fechaFin.getTime() + 31 * 24 * 60 * 60 * 1000);

          while (proximaFi.getUTCFullYear() <= targetYear) {
            const proximaFf = new Date(proximaFi.getTime() + (cantDiasDescanso - 1) * 24 * 60 * 60 * 1000);

            descansosBatch.push({
              trabajadorId: t.id,
              fechaInicio: proximaFi,
              fechaFin: proximaFf,
              cantidadDias: cantDiasDescanso,
            });
            total++;

            proximaFi = new Date(proximaFf.getTime() + 31 * 24 * 60 * 60 * 1000);
          }
        }

        if (descansosBatch.length > 0) {
          await tx.descansoProgramado.createMany({
            data: descansosBatch,
          });
        }

        return total;
      });

      res.json({
        success: true,
        generados,
        message: `Se han proyectado ${generados} descansos para el año ${targetYear} exitosamente (Régimen 30x10).`,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  public static async registrarExcepcionesRango(req: Request, res: Response): Promise<void> {
    try {
      const { trabajadorId, fechas, tipo } = req.body;
      const motivo = req.body.motivo || req.body.observacion;

      if (!trabajadorId || !fechas || !Array.isArray(fechas) || fechas.length === 0 || !tipo) {
        res.status(400).json({
          success: false,
          error: 'Campos obligatorios: trabajadorId, array de fechas (YYYY-MM-DD) y tipo.',
        });
        return;
      }

      if (tipo === 'VENTA_DESCANSO' && fechas.length > 5) {
        res.status(400).json({
          success: false,
          error: 'Reglamento 30x10: No se pueden vender más de 5 días de descanso por ciclo.',
        });
        return;
      }

      // Ejecutar dentro de una transacción atómica para garantizar que no haya grabaciones parciales
      const resultados = await prisma.$transaction(async (tx) => {
        const guardados = [];
        for (const f of fechas) {
          const guardado = await ProgramacionService.registrarExcepcion(
            {
              trabajadorId: Number(trabajadorId),
              fecha: f,
              tipo,
              motivo,
            },
            tx
          );
          guardados.push(guardado);
        }
        return guardados;
      });

      res.status(201).json({
        success: true,
        data: resultados,
        total: resultados.length,
        agregados: resultados.length,
        message: `Se registraron exitosamente ${resultados.length} días de ${tipo === 'VENTA_DESCANSO' ? 'Venta de Descanso' : 'Permiso'}.`,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}
