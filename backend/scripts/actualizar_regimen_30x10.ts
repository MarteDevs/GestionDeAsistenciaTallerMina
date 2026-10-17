import { prisma } from '../src/prisma';

async function main() {
  console.log('====================================================================');
  console.log('   MIGRACIÓN DE BASE DE DATOS: ACTUALIZACIÓN A RÉGIMEN 30x10         ');
  console.log('====================================================================\n');

  // 1. Eliminar a Marco si existiera
  const marcos = await prisma.trabajador.findMany({
    where: {
      nombres: {
        contains: 'MARCO',
      },
    },
  });

  if (marcos.length > 0) {
    for (const m of marcos) {
      await prisma.excepcion.deleteMany({ where: { trabajadorId: m.id } });
      await prisma.descansoProgramado.deleteMany({ where: { trabajadorId: m.id } });
      await prisma.trabajador.delete({ where: { id: m.id } });
      console.log(`✅ Eliminado trabajador MARCO (ID: ${m.id})`);
    }
  }

  // 2. Normalizar Áreas a solo 2 valores: 'Taller Mina' y 'Carpintería Externa'
  const updateAreas = await prisma.trabajador.updateMany({
    where: {
      area: {
        not: 'Carpintería Externa',
      },
    },
    data: {
      area: 'Taller Mina',
    },
  });
  console.log(`✅ Áreas normalizadas a "Taller Mina": ${updateAreas.count} registro(s) actualizados.`);

  // 3. Normalizar duración de descansos a 10 días para el ciclo 30x10
  const updateDescansos = await prisma.descansoProgramado.updateMany({
    where: {
      OR: [
        { cantidadDias: null as any },
        { cantidadDias: { not: 10 } },
      ],
    },
    data: {
      cantidadDias: 10,
    },
  });
  console.log(`✅ Descansos programados verificados con 10 días de descanso: ${updateDescansos.count} actualizados.`);

  // 4. Listar resumen de trabajadores activos en la base de datos
  const trabajadores = await prisma.trabajador.findMany({
    where: { activo: true },
    include: {
      _count: {
        select: { descansosProgramados: true, excepciones: true },
      },
    },
    orderBy: [{ area: 'asc' }, { nombres: 'asc' }],
  });

  console.log('\n📋 RESUMEN DE COLABORADORES ACTIVOS (RÉGIMEN 30x10):');
  console.log('--------------------------------------------------------------------');
  for (const t of trabajadores) {
    console.log(`• ID: ${t.id.toString().padEnd(3)} | Área: ${t.area.padEnd(20)} | Descansos: ${t._count.descansosProgramados.toString().padEnd(2)} | Nombre: ${t.nombres}`);
  }
  console.log('--------------------------------------------------------------------');
  console.log(`\n🎉 Migración 30x10 completada exitosamente. Total colaboradores activos: ${trabajadores.length}\n`);
}

main()
  .catch((e) => {
    console.error('❌ Error durante la migración:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
