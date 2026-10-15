import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('====================================================================');
  console.log('   MIGRACIÓN DE BASE DE DATOS: ACTUALIZAR ÁREAS Y ELIMINAR A MARCO   ');
  console.log('====================================================================\n');

  // 1. Buscar si existe algún trabajador con nombre "MARCO"
  const marcos = await prisma.trabajador.findMany({
    where: {
      nombres: {
        contains: 'MARCO',
      },
    },
    include: {
      _count: {
        select: { descansosProgramados: true, excepciones: true },
      },
    },
  });

  if (marcos.length > 0) {
    console.log(`🔍 Se encontró(aron) ${marcos.length} trabajador(es) con nombre MARCO:`);
    for (const m of marcos) {
      console.log(`   - ID: ${m.id} | Nombres: "${m.nombres}" | Área: "${m.area}" | Descansos: ${m._count.descansosProgramados} | Excepciones: ${m._count.excepciones}`);

      // Eliminar descansos y excepciones asociadas de forma segura
      await prisma.descansoProgramado.deleteMany({ where: { trabajadorId: m.id } });
      await prisma.excepcion.deleteMany({ where: { trabajadorId: m.id } });
      await prisma.trabajador.delete({ where: { id: m.id } });
      console.log(`   ✅ Eliminado trabajador ID ${m.id} (${m.nombres}) y sus registros dependientes.`);
    }
  } else {
    console.log('ℹ️ No se encontró ningún trabajador registrado con el nombre "MARCO".');
  }

  // Verificar si existe algún usuario de acceso con username o nombres MARCO
  const usuariosMarco = await prisma.usuario.findMany({
    where: {
      OR: [
        { username: { contains: 'MARCO' } },
        { nombres: { contains: 'MARCO' } },
      ],
    },
  });
  if (usuariosMarco.length > 0) {
    for (const u of usuariosMarco) {
      await prisma.usuario.delete({ where: { id: u.id } });
      console.log(`   ✅ Eliminado usuario de acceso ID ${u.id} (${u.username} - ${u.nombres}).`);
    }
  }

  // 2. Actualizar todas las áreas a "Taller Mina" excepto "Carpintería Externa"
  console.log('\n🔄 Normalizando áreas de trabajadores a los 2 valores oficiales...');
  const resUpdate = await prisma.trabajador.updateMany({
    where: {
      area: {
        not: 'Carpintería Externa',
      },
    },
    data: {
      area: 'Taller Mina',
    },
  });
  console.log(`✅ Se actualizaron ${resUpdate.count} trabajadores al área oficial 'Taller Mina'.`);

  // 3. Resumen y verificación final
  console.log('\n📋 Resumen del personal registrado y áreas asignadas:');
  const todos = await prisma.trabajador.findMany({
    orderBy: [{ area: 'asc' }, { nombres: 'asc' }],
    include: {
      _count: {
        select: { descansosProgramados: true, excepciones: true },
      },
    },
  });

  const conteoPorArea: Record<string, number> = {};
  for (const t of todos) {
    conteoPorArea[t.area] = (conteoPorArea[t.area] || 0) + 1;
    console.log(`   [${t.area}] ID: ${t.id} - ${t.nombres} (Descansos: ${t._count.descansosProgramados}, Excepciones: ${t._count.excepciones})`);
  }

  console.log('\n📊 Conteo total por área:');
  for (const [area, count] of Object.entries(conteoPorArea)) {
    console.log(`   - ${area}: ${count} trabajadores`);
  }

  console.log('\n🎉 ¡Migración ejecutada exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error durante la migración:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
