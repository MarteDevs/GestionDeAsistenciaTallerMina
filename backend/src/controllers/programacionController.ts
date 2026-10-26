import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { ProgramacionService } from '../services/programacionService';

export class ProgramacionController {
  public static async getGrilla(req: Request, res: Response): Promise<void> {
    try {
      const fechaPeru = ProgramacionService.getFechaHoyPeru();
      const anio = req.query.anio ? parseInt(req.query.anio as string) : fechaPeru.anio;
      const mes = req.query.mes ? parseInt(req.query.mes as string) : fechaPeru.mes;

      if (isNaN(anio) || isNaN(mes) || mes < 1 || mes > 12) {
        res.status(400).json({
          success: false,
          error: 'Parámetros inválidos. mes debe estar entre 1 y 12 y anio debe ser un número válido.',
        });
        return;
      }

      const grilla = await ProgramacionService.generarGrillaMensual(anio, mes);
      res.json({
        success: true,
        data: grilla,
      });
    } catch (error: any) {
      console.error('Error al generar grilla:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error interno al procesar la grilla de programación.',
      });
    }
  }

  public static async eliminarExcepcion(req: Request, res: Response): Promise<void> {
    try {
      const trabajadorId = req.body?.trabajadorId || req.query?.trabajadorId;
      const fecha = req.body?.fecha || req.query?.fecha;
      const fechas = req.body?.fechas;

      if (!trabajadorId || (!fecha && (!fechas || !Array.isArray(fechas) || fechas.length === 0))) {
        res.status(400).json({ success: false, error: 'trabajadorId y al menos una fecha son requeridos' });
        return;
      }

      await ProgramacionService.eliminarExcepcion({
        trabajadorId: Number(trabajadorId),
        fecha: fecha ? String(fecha) : undefined,
        fechas: Array.isArray(fechas) ? fechas.map(String) : undefined,
      });

      res.json({
        success: true,
        message: 'Excepción(es) anulada(s) correctamente. El día ha vuelto a su estado original.',
      });
    } catch (error: any) {
      console.error('Error al eliminar excepción:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  public static async actualizarExcepcion(req: Request, res: Response): Promise<void> {
    try {
      const { trabajadorId, fecha, motivo, tipo } = req.body;
      if (!trabajadorId || !fecha) {
        res.status(400).json({ success: false, error: 'trabajadorId y fecha son requeridos' });
        return;
      }

      const excepcion = await ProgramacionService.actualizarExcepcion({
        trabajadorId: Number(trabajadorId),
        fecha: String(fecha),
        motivo,
        tipo,
      });

      res.json({
        success: true,
        data: excepcion,
        message: 'Excepción actualizada correctamente.',
      });
    } catch (error: any) {
      console.error('Error al actualizar excepción:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Obtener los días de un bloque de descanso y el estado actual de cada día
  public static async getDetalleBloqueDescanso(req: Request, res: Response): Promise<void> {
    try {
      const trabajadorId = parseInt(req.query.trabajadorId as string);
      const fecha = req.query.fecha as string;

      if (!trabajadorId || !fecha) {
        res.status(400).json({ success: false, error: 'trabajadorId y fecha son requeridos' });
        return;
      }

      const fechaObj = new Date(`${fecha}T00:00:00.000Z`);

      // Buscar si la fecha cae dentro de un descanso programado base
      const descanso = await prisma.descansoProgramado.findFirst({
        where: {
          trabajadorId,
          fechaInicio: { lte: fechaObj },
          fechaFin: { gte: fechaObj },
        },
      });

      if (!descanso) {
        // No está en descanso programado base: verificar si este día laboral tiene permiso registrado
        const excepcionDia = await prisma.excepcion.findUnique({
          where: {
            trabajadorId_fecha: {
              trabajadorId,
              fecha: fechaObj,
            },
          },
        });

        res.json({
          success: true,
          esDescansoBase: false,
          dias: [],
          excepcionActual: excepcionDia
            ? {
                tipo: excepcionDia.tipo,
                motivo: excepcionDia.motivo,
                fecha: ProgramacionService.formatFechaIso(new Date(excepcionDia.fecha)),
              }
            : null,
        });
        return;
      }

      // Obtener excepciones que ya existan dentro de ese período
      const excepciones = await prisma.excepcion.findMany({
        where: {
          trabajadorId,
          fecha: {
            gte: descanso.fechaInicio,
            lte: descanso.fechaFin,
          },
        },
      });

      const excMap = new Map<string, { tipo: string; motivo: string | null }>();
      excepciones.forEach((e) => {
        excMap.set(ProgramacionService.formatFechaIso(new Date(e.fecha)), {
          tipo: e.tipo,
          motivo: e.motivo,
        });
      });

      const diasBloque = [];
      const fi = new Date(descanso.fechaInicio);
      const ff = new Date(descanso.fechaFin);

      const nombresDias = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];

      let curr = new Date(fi);
      while (curr <= ff) {
        const fechaStr = ProgramacionService.formatFechaIso(curr);
        const excInfo = excMap.get(fechaStr);
        const estado = excInfo ? (excInfo.tipo === 'VENTA_DESCANSO' ? 'VD' : 'P') : 'DL';

        diasBloque.push({
          fecha: fechaStr,
          diaNumero: curr.getUTCDate(),
          diaSemana: nombresDias[curr.getUTCDay()],
          estado,
          disponibleParaVenta: estado === 'DL',
          motivo: excInfo ? excInfo.motivo : null,
        });

        curr = new Date(curr.getTime() + 24 * 60 * 60 * 1000);
      }

      res.json({
        success: true,
        esDescansoBase: true,
        periodo: {
          fechaInicio: ProgramacionService.formatFechaIso(descanso.fechaInicio),
          fechaFin: ProgramacionService.formatFechaIso(descanso.fechaFin),
          cantidadDias: descanso.cantidadDias,
        },
        dias: diasBloque,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  public static async crearExcepcion(req: Request, res: Response): Promise<void> {
    try {
      const { trabajadorId, fecha, tipo, motivo } = req.body;

      if (!trabajadorId || !fecha || !tipo) {
        res.status(400).json({
          success: false,
          error: 'Campos obligatorios: trabajadorId, fecha (YYYY-MM-DD) y tipo.',
        });
        return;
      }

      const excepcion = await ProgramacionService.registrarExcepcion({
        trabajadorId: Number(trabajadorId),
        fecha,
        tipo,
        motivo,
      });

      res.status(201).json({
        success: true,
        data: excepcion,
        message: 'Excepción registrada exitosamente.',
      });
    } catch (error: any) {
      console.error('Error al registrar excepción:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Error al procesar la excepción.',
      });
    }
  }
}
