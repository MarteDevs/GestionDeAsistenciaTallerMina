import { Request, Response } from 'express';
import { ProgramacionService, TipoExcepcion } from '../services/programacionService';

export class ProgramacionController {
  public static async getGrilla(req: Request, res: Response): Promise<void> {
    try {
      const anio = parseInt(req.query.anio as string) || new Date().getUTCFullYear();
      const mes = parseInt(req.query.mes as string) || new Date().getUTCMonth() + 1;

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

      if (!Object.values(TipoExcepcion).includes(tipo)) {
        res.status(400).json({
          success: false,
          error: `Tipo no válido. Debe ser uno de: ${Object.values(TipoExcepcion).join(', ')}`,
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
