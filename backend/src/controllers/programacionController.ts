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
      const { trabajadorId, fecha } = req.body;
      if (!trabajadorId || !fecha) {
        res.status(400).json({ success: false, error: 'trabajadorId y fecha son requeridos' });
        return;
      }
      await ProgramacionService.eliminarExcepcion({
        trabajadorId: Number(trabajadorId),
        fecha: String(fecha),
      });
      res.json({
        success: true,
        message: 'Excepción eliminada correctamente. El día ha vuelto a su estado original.',
      });
    } catch (error: any) {
      console.error('Error al eliminar excepción:', error);
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
        // No está en descanso programado base
        res.json({
          success: true,
          esDescansoBase: false,
          dias: [],
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

      const excMap = new Map<string, string>();
      excepciones.forEach((e) => {
        excMap.set(ProgramacionService.formatFechaIso(new Date(e.fecha)), e.tipo);
      });

      const diasBloque = [];
      const fi = new Date(descanso.fechaInicio);
      const ff = new Date(descanso.fechaFin);

      const nombresDias = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];

      let curr = new Date(fi);
      while (curr <= ff) {
        const fechaStr = ProgramacionService.formatFechaIso(curr);
        const excTipo = excMap.get(fechaStr);
        const estado = excTipo ? (excTipo === 'VENTA_DESCANSO' ? 'VD' : 'P') : 'DL';

        diasBloque.push({
          fecha: fechaStr,
          diaNumero: curr.getUTCDate(),
          diaSemana: nombresDias[curr.getUTCDay()],
          estado,
          disponibleParaVenta: estado === 'DL',
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
