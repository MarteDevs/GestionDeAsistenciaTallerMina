import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ProgramacionService } from '../services/programacionService';

const prisma = new PrismaClient();

export class TrabajadorController {
  public static async listar(req: Request, res: Response): Promise<void> {
    try {
      const { incluirInactivos } = req.query;
      const where = incluirInactivos === 'true' ? {} : { activo: true };

      const trabajadores = await prisma.trabajador.findMany({
        where,
        orderBy: { nombres: 'asc' },
        include: {
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
        diasTrabajo = 20,
      } = req.body;

      if (!nombres || !area) {
        res.status(400).json({ success: false, error: 'Nombres y Área son obligatorios.' });
        return;
      }

      const trabajador = await prisma.trabajador.create({
        data: {
          nombres: nombres.trim().toUpperCase(),
          area: area.trim(),
          activo: true,
        },
      });

      // Cálculo a partir de FECHA DE INICIO DE TRABAJO
      // Ejemplo: Entra a trabajar el 01/01/2026.
      // Trabaja 20 días (del 01 al 20 de enero).
      // Su descanso inicia el día 21: fechaInicioTrabajo + diasTrabajo
      if (fechaInicioTrabajo) {
        const cantDescanso = parseInt(diasDescanso) || 10;
        const cantTrabajo = parseInt(diasTrabajo) || 20;

        const inicioTrabajo = new Date(`${fechaInicioTrabajo}T00:00:00.000Z`);
        const anioLimite = inicioTrabajo.getUTCFullYear();

        // Primer descanso arranca tras cumplir los primeros días de trabajo
        let fi = new Date(inicioTrabajo.getTime() + cantTrabajo * 24 * 60 * 60 * 1000);

        // Proyectar todos los descansos dentro del año calendario
        while (fi.getUTCFullYear() <= anioLimite) {
          const ff = new Date(fi.getTime() + (cantDescanso - 1) * 24 * 60 * 60 * 1000);

          await prisma.descansoProgramado.create({
            data: {
              trabajadorId: trabajador.id,
              fechaInicio: fi,
              fechaFin: ff,
              cantidadDias: cantDescanso,
            },
          });

          // Siguiente descanso: fin descanso anterior + 1 día + días de trabajo
          fi = new Date(ff.getTime() + (cantTrabajo + 1) * 24 * 60 * 60 * 1000);
        }
      }

      res.status(201).json({
        success: true,
        data: trabajador,
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

      const trabajadores = await prisma.trabajador.findMany({
        where: { activo: true },
        include: {
          descansosProgramados: {
            orderBy: { fechaFin: 'desc' },
            take: 1,
          },
        },
      });

      let generados = 0;

      for (const t of trabajadores) {
        if (t.descansosProgramados.length === 0) continue;

        const ultimoDescanso = t.descansosProgramados[0];
        const cantDiasDescanso = ultimoDescanso.cantidadDias || 10;
        
        let proximaFi = new Date(ultimoDescanso.fechaFin.getTime() + 21 * 24 * 60 * 60 * 1000);

        while (proximaFi.getUTCFullYear() <= targetYear) {
          const proximaFf = new Date(proximaFi.getTime() + (cantDiasDescanso - 1) * 24 * 60 * 60 * 1000);

          await prisma.descansoProgramado.create({
            data: {
              trabajadorId: t.id,
              fechaInicio: proximaFi,
              fechaFin: proximaFf,
              cantidadDias: cantDiasDescanso,
            },
          });
          generados++;

          proximaFi = new Date(proximaFf.getTime() + 21 * 24 * 60 * 60 * 1000);
        }
      }

      res.json({
        success: true,
        generados,
        message: `Se han proyectado ${generados} descansos para el año ${targetYear} exitosamente.`,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  public static async registrarExcepcionesRango(req: Request, res: Response): Promise<void> {
    try {
      const { trabajadorId, fechas, tipo, motivo } = req.body;

      if (!trabajadorId || !fechas || !Array.isArray(fechas) || fechas.length === 0 || !tipo) {
        res.status(400).json({
          success: false,
          error: 'Campos obligatorios: trabajadorId, array de fechas (YYYY-MM-DD) y tipo.',
        });
        return;
      }

      const resultados = [];
      for (const f of fechas) {
        const guardado = await ProgramacionService.registrarExcepcion({
          trabajadorId: Number(trabajadorId),
          fecha: f,
          tipo,
          motivo,
        });
        resultados.push(guardado);
      }

      res.status(201).json({
        success: true,
        data: resultados,
        total: resultados.length,
        message: `Se registraron exitosamente ${resultados.length} días de ${tipo === 'VENTA_DESCANSO' ? 'Venta de Descanso' : 'Permiso'}.`,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}
