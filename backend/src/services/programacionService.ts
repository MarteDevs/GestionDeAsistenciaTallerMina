import { TipoExcepcion } from '@prisma/client';
import { prisma } from '../prisma';

export { TipoExcepcion };

export type EstadoDia = '1' | 'DL' | 'VD' | 'P';

export interface DiaCalculado {
  fecha: string;        // 'YYYY-MM-DD'
  diaNumero: number;    // 1..31
  diaSemana: string;    // 'LUN', 'MAR', etc.
  estado: EstadoDia;
  motivoExcepcion?: string | null;
}

export interface FilaProgramacionTrabajador {
  trabajadorId: number;
  nombres: string;
  area: string;
  dias: DiaCalculado[];
  resumen: {
    totalTrabajados: number; // '1' + 'VD'
    totalDescansos: number;  // 'DL'
    totalVentas: number;     // 'VD'
    totalPermisos: number;   // 'P'
  };
}

export interface GrillaMensualResponse {
  anio: number;
  mes: number;
  totalDiasMes: number;
  encabezados: {
    diaNumero: number;
    diaSemana: string;
    fecha: string;
  }[];
  filas: FilaProgramacionTrabajador[];
}

export class ProgramacionService {
  public static getFechaHoyPeru(): { anio: number; mes: number; dia: number; fechaIso: string; dateUtc: Date } {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Lima',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const fechaIso = formatter.format(new Date()); // 'YYYY-MM-DD'
    const [anio, mes, dia] = fechaIso.split('-').map(Number);
    const dateUtc = new Date(Date.UTC(anio, mes - 1, dia));
    return { anio, mes, dia, fechaIso, dateUtc };
  }

  public static formatFechaIso(date: Date): string {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  public static async generarGrillaMensual(anio: number, mes: number): Promise<GrillaMensualResponse> {
    const primerDiaMes = new Date(Date.UTC(anio, mes - 1, 1));
    const ultimoDiaMes = new Date(Date.UTC(anio, mes, 0));
    const totalDiasMes = ultimoDiaMes.getUTCDate();

    const trabajadores = await prisma.trabajador.findMany({
      where: { activo: true },
      include: {
        descansosProgramados: {
          where: {
            fechaInicio: { lte: ultimoDiaMes },
            fechaFin: { gte: primerDiaMes },
          },
        },
        excepciones: {
          where: {
            fecha: {
              gte: primerDiaMes,
              lte: ultimoDiaMes,
            },
          },
        },
      },
      orderBy: { nombres: 'asc' },
    });

    const nombresDias = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];

    const encabezados = Array.from({ length: totalDiasMes }, (_, i) => {
      const diaNum = i + 1;
      const fechaObj = new Date(Date.UTC(anio, mes - 1, diaNum));
      return {
        diaNumero: diaNum,
        diaSemana: nombresDias[fechaObj.getUTCDay()],
        fecha: ProgramacionService.formatFechaIso(fechaObj),
      };
    });

    const filas: FilaProgramacionTrabajador[] = trabajadores.map((trabajador) => {
      let totalTrabajados = 0;
      let totalDescansos = 0;
      let totalVentas = 0;
      let totalPermisos = 0;

      const excepcionesMap = new Map<string, { tipo: TipoExcepcion; motivo: string | null }>();
      trabajador.excepciones.forEach((exc) => {
        const fechaStr = ProgramacionService.formatFechaIso(new Date(exc.fecha));
        excepcionesMap.set(fechaStr, { tipo: exc.tipo, motivo: exc.motivo });
      });

      const dias: DiaCalculado[] = encabezados.map((encabezado) => {
        const fechaActual = new Date(`${encabezado.fecha}T00:00:00.000Z`);

        let estado: EstadoDia = '1';
        let motivoExcepcion: string | null = null;

        const esDescansoProgramado = trabajador.descansosProgramados.some((dp) => {
          const inicio = new Date(dp.fechaInicio);
          const fin = new Date(dp.fechaFin);
          return fechaActual >= inicio && fechaActual <= fin;
        });

        if (esDescansoProgramado) {
          estado = 'DL';
        }

        const excepcion = excepcionesMap.get(encabezado.fecha);
        if (excepcion) {
          motivoExcepcion = excepcion.motivo;
          if (excepcion.tipo === TipoExcepcion.VENTA_DESCANSO) {
            estado = 'VD';
          } else if (excepcion.tipo === TipoExcepcion.PERMISO) {
            estado = 'P';
          }
        }

        if (estado === '1') totalTrabajados++;
        if (estado === 'DL') totalDescansos++;
        if (estado === 'VD') {
          totalVentas++;
          totalTrabajados++;
        }
        if (estado === 'P') totalPermisos++;

        return {
          fecha: encabezado.fecha,
          diaNumero: encabezado.diaNumero,
          diaSemana: encabezado.diaSemana,
          estado,
          motivoExcepcion,
        };
      });

      return {
        trabajadorId: trabajador.id,
        nombres: trabajador.nombres,
        area: trabajador.area,
        dias,
        resumen: {
          totalTrabajados,
          totalDescansos,
          totalVentas,
          totalPermisos,
        },
      };
    });

    return {
      anio,
      mes,
      totalDiasMes,
      encabezados,
      filas,
    };
  }

  public static async registrarExcepcion(
    data: {
      trabajadorId: number;
      fecha: string;
      tipo: TipoExcepcion;
      motivo?: string;
    },
    client: any = prisma
  ) {
    const { trabajadorId, fecha, tipo, motivo } = data;
    const fechaLimpia = String(fecha).split('T')[0];
    const fechaObj = new Date(`${fechaLimpia}T00:00:00.000Z`);

    const trabajador = await client.trabajador.findUnique({
      where: { id: trabajadorId },
      include: {
        descansosProgramados: true,
      },
    });

    if (!trabajador || !trabajador.activo) {
      throw new Error('El trabajador especificado no existe o está inactivo.');
    }

    const descansoCorrespondiente = trabajador.descansosProgramados.find((dp: any) => {
      const inicio = new Date(dp.fechaInicio);
      const fin = new Date(dp.fechaFin);
      return fechaObj >= inicio && fechaObj <= fin;
    });

    if (tipo === TipoExcepcion.VENTA_DESCANSO) {
      if (!descansoCorrespondiente) {
        throw new Error(
          'Operación inválida: No se puede registrar Venta de Descanso en un día programado como laborable.'
        );
      }

      // Validar en BD que en este ciclo no se superen los 5 días vendidos de descanso
      const ventasEnCiclo = await client.excepcion.count({
        where: {
          trabajadorId,
          tipo: TipoExcepcion.VENTA_DESCANSO,
          fecha: {
            gte: new Date(descansoCorrespondiente.fechaInicio),
            lte: new Date(descansoCorrespondiente.fechaFin),
          },
          NOT: {
            fecha: fechaObj,
          },
        },
      });

      if (ventasEnCiclo >= 5) {
        throw new Error(
          `Reglamento 30x10: Este ciclo de descanso ya cuenta con el tope máximo legal de 5 días vendidos.`
        );
      }
    }

    if (tipo === TipoExcepcion.PERMISO && descansoCorrespondiente) {
      throw new Error(
        'Operación inválida: No se puede registrar Permiso en un día que ya es Descanso Libre.'
      );
    }

    const excepcionGuardada = await client.excepcion.upsert({
      where: {
        trabajadorId_fecha: {
          trabajadorId,
          fecha: fechaObj,
        },
      },
      update: {
        tipo,
        motivo: motivo || null,
      },
      create: {
        trabajadorId,
        fecha: fechaObj,
        tipo,
        motivo: motivo || null,
      },
    });

    return excepcionGuardada;
  }

  public static async eliminarExcepcion(
    data: { trabajadorId: number; fecha: string },
    client: any = prisma
  ) {
    const { trabajadorId, fecha } = data;
    const fechaLimpia = String(fecha).split('T')[0];
    const fechaObj = new Date(`${fechaLimpia}T00:00:00.000Z`);
    return await client.excepcion.deleteMany({
      where: {
        trabajadorId,
        fecha: fechaObj,
      },
    });
  }
}
