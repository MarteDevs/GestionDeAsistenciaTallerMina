import { PrismaClient, TipoExcepcion, RolUsuario, EstadoUsuario } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const datosProgramacion = {
  titulo: "PROGRAMACIÓN TALLER MINA 2026",
  participantes: [
    {
      id: 1,
      nombre: "MORALES MATOS EDITH",
      periodos: [
        { fi: "16-Ene", ff: "25-Ene", q: 10 },
        { fi: "25-Feb", ff: "6-Mar", q: 10 },
        { fi: "6-Abr", ff: "15-Abr", q: 10 },
        { fi: "16-May", ff: "25-May", q: 10 },
        { fi: "25-Jun", ff: "4-Jul", q: 10 },
        { fi: "4-Ago", ff: "13-Ago", q: 10 },
        { fi: "13-Set", ff: "22-Set", q: 10 },
        { fi: "23-Oct", ff: "1-Nov", q: 10 },
        { fi: "2-Dic", ff: "11-Dic", q: 10 }
      ]
    },
    {
      id: 2,
      nombre: "POLO TANDAYPAN JORGE",
      periodos: [
        { fi: "3-Ene", ff: "12-Ene", q: 10 },
        { fi: "12-Feb", ff: "21-Feb", q: 10 },
        { fi: "24-Mar", ff: "2-Abr", q: 10 },
        { fi: "3-May", ff: "12-May", q: 10 },
        { fi: "12-Jun", ff: "21-Jun", q: 10 },
        { fi: "22-Jul", ff: "31-Jul", q: 10 },
        { fi: "31-Ago", ff: "9-Set", q: 10 },
        { fi: "10-Oct", ff: "19-Oct", q: 10 },
        { fi: "19-Nov", ff: "28-Nov", q: 10 },
        { fi: "29-Dic", ff: "7-Ene", q: 10 }
      ]
    },
    {
      id: 3,
      nombre: "CELESTINO AGUILAR LARRY MOLL",
      periodos: [
        { fi: "30-Ene", ff: "8-Feb", q: 10 },
        { fi: "11-Mar", ff: "20-Mar", q: 10 },
        { fi: "20-Abr", ff: "29-Abr", q: 10 },
        { fi: "30-May", ff: "8-Jun", q: 10 },
        { fi: "9-Jul", ff: "18-Jul", q: 10 },
        { fi: "18-Ago", ff: "27-Ago", q: 10 },
        { fi: "27-Set", ff: "6-Oct", q: 10 },
        { fi: "6-Nov", ff: "15-Nov", q: 10 },
        { fi: "16-Dic", ff: "25-Dic", q: 10 }
      ]
    },
    {
      id: 4,
      nombre: "BACA MORENO JUSTINIANO",
      periodos: [
        { fi: "7-Ene", ff: "16-Ene", q: 10 },
        { fi: "16-Feb", ff: "25-Feb", q: 10 },
        { fi: "28-Mar", ff: "6-Abr", q: 10 },
        { fi: "7-May", ff: "16-May", q: 10 },
        { fi: "16-Jun", ff: "25-Jun", q: 10 },
        { fi: "26-Jul", ff: "4-Ago", q: 10 },
        { fi: "4-Set", ff: "13-Set", q: 10 },
        { fi: "14-Oct", ff: "23-Oct", q: 10 },
        { fi: "23-Nov", ff: "2-Dic", q: 10 }
      ]
    },
    {
      id: 5,
      nombre: "REYES GERBACIO ALFREDO",
      periodos: [
        { fi: "26-En", ff: "4-Feb", q: 10 },
        { fi: "7-Mar", ff: "16-Mar", q: 10 },
        { fi: "16-Abr", ff: "25-Abr", q: 10 },
        { fi: "26-May", ff: "4-Jun", q: 10 },
        { fi: "5-Jul", ff: "14-Jul", q: 10 },
        { fi: "14-Ago", ff: "23-Ago", q: 10 },
        { fi: "23-Set", ff: "2-Oct", q: 10 },
        { fi: "2-Nov", ff: "11-Nov", q: 10 },
        { fi: "12-Dic", ff: "21-Dic", q: 10 }
      ]
    },
    {
      id: null,
      nombre: "CELESTINO AGUILAR MANUEL",
      periodos: []
    },
    {
      id: 6,
      nombre: "NOGUERA MOLINA EDINSON JOSE",
      periodos: [
        { fi: "18-Ene", ff: "27-Ene", q: 10 },
        { fi: "27-Feb", ff: "8-Mar", q: 10 },
        { fi: "8-Abr", ff: "17-Abr", q: 10 },
        { fi: "18-May", ff: "27-May", q: 10 },
        { fi: "27-Jun", ff: "6-Jul", q: 10 },
        { fi: "6-Ago", ff: "15-Ago", q: 10 },
        { fi: "15-Set", ff: "24-Set", q: 10 },
        { fi: "25-Oct", ff: "3-Nov", q: 10 },
        { fi: "4-Dic", ff: "13-Dic", q: 10 }
      ]
    },
    {
      id: 7,
      nombre: "FASABI CASTILLO LUIS ALBERTO",
      periodos: [
        { fi: "4-Feb", ff: "13-Feb", q: 10 },
        { fi: "16-Mar", ff: "25-Mar", q: 10 },
        { fi: "25-Abr", ff: "4-May", q: 10 },
        { fi: "4-Jun", ff: "13-Jun", q: 10 },
        { fi: "14-Jul", ff: "23-Jul", q: 10 },
        { fi: "23-Ago", ff: "1-Set", q: 10 },
        { fi: "2-Oct", ff: "11-Oct", q: 10 },
        { fi: "11-Nov", ff: "20-Nov", q: 10 },
        { fi: "21-Dic", ff: "30-Dic", q: 10 }
      ]
    },
    {
      id: 8,
      nombre: "ULLOA DOMINGUEZ YOSBIN JEINER",
      periodos: [
        { fi: "9-Ene", ff: "18-Ene", q: 10 },
        { fi: "18-Feb", ff: "27-Feb", q: 10 },
        { fi: "30-Mar", ff: "8-Abr", q: 10 },
        { fi: "9-May", ff: "18-May", q: 10 },
        { fi: "18-Jun", ff: "27-Jun", q: 10 },
        { fi: "28-Jul", ff: "6-Ago", q: 10 },
        { fi: "6-Set", ff: "15-Set", q: 10 },
        { fi: "16-Oct", ff: "25-Oct", q: 10 },
        { fi: "25-Nov", ff: "4-Dic", q: 10 }
      ]
    },
    {
      id: null,
      nombre: "CAMPOS GELBERT YURI",
      periodos: [
        { fi: "16-Abr", ff: "25-Abr", q: 10 },
        { fi: "26-May", ff: "4-Jun", q: 10 },
        { fi: "5-Jul", ff: "14-Jul", q: 10 },
        { fi: "14-Ago", ff: "23-Ago", q: 10 },
        { fi: "23-Set", ff: "2-Oct", q: 10 },
        { fi: "2-Nov", ff: "11-Nov", q: 10 },
        { fi: "12-Dic", ff: "21-Dic", q: 10 }
      ]
    },
    {
      id: "XD",
      nombre: "HEBER NOÉ CUSTODIO RUIZ",
      periodos: [
        { fi: "2-Ene", ff: "11-Ene", q: 10 },
        { fi: "11-Feb", ff: "20-Feb", q: 10 },
        { fi: "23-Mar", ff: "1-Abr", q: 10 },
        { fi: "2-May", ff: "11-May", q: 10 },
        { fi: "11-Jun", ff: "20-Jun", q: 10 },
        { fi: "21-Jul", ff: "30-Jul", q: 10 },
        { fi: "30-Ago", ff: "8-Set", q: 10 },
        { fi: "9-Oct", ff: "18-Oct", q: 10 },
        { fi: "18-Nov", ff: "27-Nov", q: 10 },
        { fi: "28-Dic", ff: "6-Ene", q: 10 }
      ]
    },
    {
      id: 10,
      nombre: "MARITZA",
      periodos: [
        { fi: "14-Feb", ff: "23-Feb", q: 10 },
        { fi: "26-Mar", ff: "4-Abr", q: 10 },
        { fi: "5-May", ff: "14-May", q: 10 },
        { fi: "14-Jun", ff: "23-Jun", q: 10 },
        { fi: "24-Jul", ff: "2-Ago", q: 10 },
        { fi: "2-Set", ff: "11-Set", q: 10 },
        { fi: "12-Oct", ff: "21-Oct", q: 10 },
        { fi: "21-Nov", ff: "30-Nov", q: 10 },
        { fi: "31-Dic", ff: null, q: null }
      ]
    },
    {
      id: 1,
      nombre: "PABLO ANTICONA",
      tabla: "secundaria",
      periodos: [
        { fi: "25-EN", ff: "3-Feb", q: 10 },
        { fi: "6-Mar", ff: "15-Mar", q: 10 },
        { fi: "15-Abr", ff: "24-Abr", q: 10 },
        { fi: "25-May", ff: "3-Jun", q: 10 },
        { fi: "4-Jul", ff: "13-Jul", q: 10 },
        { fi: "13-Ago", ff: "22-Ago", q: 10 },
        { fi: "22-Set", ff: "1-Oct", q: 10 },
        { fi: "1-Nov", ff: "10-Nov", q: 10 },
        { fi: "11-Dic", ff: "20-Dic", q: 10 }
      ]
    }
  ]
};

const MESES_MAP: Record<string, number> = {
  ene: 1, en: 1,
  feb: 2,
  mar: 3,
  abr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  ago: 8,
  set: 9, sep: 9,
  oct: 10,
  nov: 11,
  dic: 12
};

function parseFecha(str: string, anioBase = 2026, mesContexto = 1): Date | null {
  if (!str) return null;
  const match = str.trim().match(/^(\d{1,2})-([A-Za-z]+)$/);
  if (!match) return null;

  const dia = parseInt(match[1], 10);
  const mesStr = match[2].toLowerCase();
  const mes = MESES_MAP[mesStr];
  if (!mes) return null;

  // Si el mes final es enero (ej. 7-Ene después de un 29-Dic), corresponde al año siguiente (2027)
  const anio = (mesContexto === 12 && mes === 1) ? anioBase + 1 : anioBase;
  return new Date(Date.UTC(anio, mes - 1, dia));
}

async function main() {
  console.log('--- Iniciando Seeding de Datos Reales de Taller Mina 2026 y Usuarios ---');

  // Limpiar datos
  await prisma.excepcion.deleteMany({});
  await prisma.descansoProgramado.deleteMany({});
  await prisma.trabajador.deleteMany({});
  await prisma.usuario.deleteMany({});

  // 1. Crear Usuarios de Sistema (Administrador Principal JORGE, Administrador, Supervisor, etc.)
  const passwordHashJorge = await bcrypt.hash('POLTAND1', 10);
  const passwordHashAdmin = await bcrypt.hash('admin123', 10);

  // Administrador Principal: JORGE (password: POLTAND1)
  await prisma.usuario.create({
    data: {
      email: 'jorge@tallermina.com',
      username: 'JORGE',
      password: passwordHashJorge,
      nombres: 'Jorge Polo Tandaypan',
      rol: RolUsuario.ADMIN,
      estado: EstadoUsuario.ACTIVO,
      aprobadoEn: new Date(),
    },
  });

  // Administrador secundario
  await prisma.usuario.create({
    data: {
      email: 'admin@tallermina.com',
      username: 'ADMIN',
      password: passwordHashAdmin,
      nombres: 'Administrador General',
      rol: RolUsuario.ADMIN,
      estado: EstadoUsuario.ACTIVO,
      aprobadoEn: new Date(),
    },
  });

  // Supervisor de turno
  await prisma.usuario.create({
    data: {
      email: 'supervisor@tallermina.com',
      username: 'SUPERVISOR',
      password: passwordHashAdmin,
      nombres: 'Supervisor de Turno',
      rol: RolUsuario.SUPERVISOR,
      estado: EstadoUsuario.ACTIVO,
      aprobadoEn: new Date(),
    },
  });

  // Usuario pendiente para demostrar el flujo de aprobación
  await prisma.usuario.create({
    data: {
      email: 'operador.nuevo@tallermina.com',
      username: 'OPERADOR',
      password: passwordHashAdmin,
      nombres: 'Juan Nuevo (Solicitud Pendiente)',
      rol: RolUsuario.TRABAJADOR,
      estado: EstadoUsuario.PENDIENTE,
    },
  });

  console.log('Usuarios creados: JORGE (ADMIN, pass: POLTAND1), ADMIN, SUPERVISOR y OPERADOR.');

  // 2. Insertar Trabajadores y sus Descansos Programados 2026
  let countTrabajadores = 0;
  let countPeriodos = 0;

  for (const p of datosProgramacion.participantes) {
    const trabajador = await prisma.trabajador.create({
      data: {
        nombres: p.nombre.trim(),
        area: (p as any).tabla === 'secundaria' ? 'Carpintería Externa' : 'Taller Mina',
        activo: true,
      },
    });
    countTrabajadores++;

    for (const per of p.periodos) {
      if (!per.fi) continue;

      const fiDate = parseFecha(per.fi, 2026);
      if (!fiDate) continue;

      let ffDate: Date | null = null;
      if (per.ff) {
        const mesFi = fiDate.getUTCMonth() + 1;
        ffDate = parseFecha(per.ff, 2026, mesFi);
      }

      // Si no tiene fecha fin, calculamos fi + 9 días (para completar 10 días)
      if (!ffDate) {
        ffDate = new Date(fiDate.getTime() + (9 * 24 * 60 * 60 * 1000));
      }

      const diffTime = Math.abs(ffDate.getTime() - fiDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      await prisma.descansoProgramado.create({
        data: {
          trabajadorId: trabajador.id,
          fechaInicio: fiDate,
          fechaFin: ffDate,
          cantidadDias: per.q || diffDays,
        },
      });
      countPeriodos++;
    }
  }

  console.log(`Trabajadores creados: ${countTrabajadores}`);
  console.log(`Períodos de descanso creados: ${countPeriodos}`);
  console.log('--- Carga de datos reales completada exitosamente ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
