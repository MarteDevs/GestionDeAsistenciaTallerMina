import { prisma } from '../src/prisma';

async function main() {
  try {
    await prisma.$executeRawUnsafe(
      "ALTER TABLE usuarios MODIFY COLUMN rol ENUM('ADMIN', 'SUPERVISOR', 'SECRETARIA', 'TRABAJADOR') NOT NULL DEFAULT 'SUPERVISOR'"
    );
    console.log('ENUM successfully updated in MySQL!');
  } catch (err) {
    console.error('Error modifying enum:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
