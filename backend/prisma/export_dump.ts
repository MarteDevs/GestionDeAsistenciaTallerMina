import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

function toSqlDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function escapeSql(str: string): string {
  return str.replace(/'/g, "''");
}

async function dump() {
  console.log('Generando script SQL completo...');
  const usuarios = await prisma.usuario.findMany({ orderBy: { id: 'asc' } });
  const trabajadores = await prisma.trabajador.findMany({ orderBy: { id: 'asc' } });
  const descansos = await prisma.descansoProgramado.findMany({ orderBy: [{ trabajadorId: 'asc' }, { fechaInicio: 'asc' }] });

  let sql = `-- ======================================================================\n`;
  sql += `-- SCRIPT COMPLETO DE BASE DE DATOS: taller_mina\n`;
  sql += `-- Motor: MySQL 8.0+ / 9.0+\n`;
  sql += `-- Generado: ${new Date().toISOString()}\n`;
  sql += `-- Incluye: DDL estructurado + Carga de Usuarios y 13 Trabajadores 2026\n`;
  sql += `-- NOTA: Las excepciones (días vendidos/permisos) se inician limpias en cero.\n`;
  sql += `-- ======================================================================\n\n`;

  sql += `CREATE DATABASE IF NOT EXISTS \`taller_mina\`\n`;
  sql += `  CHARACTER SET utf8mb4\n`;
  sql += `  COLLATE utf8mb4_unicode_ci;\n\n`;
  sql += `USE \`taller_mina\`;\n\n`;

  sql += `SET FOREIGN_KEY_CHECKS = 0;\n`;
  sql += `DROP TABLE IF EXISTS \`excepciones\`;\n`;
  sql += `DROP TABLE IF EXISTS \`descansos_programados\`;\n`;
  sql += `DROP TABLE IF EXISTS \`trabajadores\`;\n`;
  sql += `DROP TABLE IF EXISTS \`usuarios\`;\n`;
  sql += `SET FOREIGN_KEY_CHECKS = 1;\n\n`;

  // Tabla usuarios
  sql += `-- -----------------------------------------------------\n`;
  sql += `-- Tabla: usuarios\n`;
  sql += `-- -----------------------------------------------------\n`;
  sql += `CREATE TABLE \`usuarios\` (\n`;
  sql += `  \`id\` INT NOT NULL AUTO_INCREMENT,\n`;
  sql += `  \`email\` VARCHAR(150) NOT NULL,\n`;
  sql += `  \`username\` VARCHAR(100) NULL,\n`;
  sql += `  \`password\` VARCHAR(255) NOT NULL,\n`;
  sql += `  \`nombres\` VARCHAR(150) NOT NULL,\n`;
  sql += `  \`rol\` ENUM('ADMIN', 'SUPERVISOR', 'TRABAJADOR') NOT NULL DEFAULT 'SUPERVISOR',\n`;
  sql += `  \`estado\` ENUM('PENDIENTE', 'ACTIVO', 'RECHAZADO') NOT NULL DEFAULT 'PENDIENTE',\n`;
  sql += `  \`aprobado_en\` DATETIME NULL,\n`;
  sql += `  \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n`;
  sql += `  \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),\n`;
  sql += `  PRIMARY KEY (\`id\`),\n`;
  sql += `  UNIQUE INDEX \`usuarios_email_key\` (\`email\`),\n`;
  sql += `  UNIQUE INDEX \`usuarios_username_key\` (\`username\`)\n`;
  sql += `) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;\n\n`;

  // Tabla trabajadores
  sql += `-- -----------------------------------------------------\n`;
  sql += `-- Tabla: trabajadores\n`;
  sql += `-- -----------------------------------------------------\n`;
  sql += `CREATE TABLE \`trabajadores\` (\n`;
  sql += `  \`id\` INT NOT NULL AUTO_INCREMENT,\n`;
  sql += `  \`nombres\` VARCHAR(150) NOT NULL,\n`;
  sql += `  \`area\` VARCHAR(100) NOT NULL,\n`;
  sql += `  \`activo\` TINYINT(1) NOT NULL DEFAULT 1,\n`;
  sql += `  \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n`;
  sql += `  \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),\n`;
  sql += `  PRIMARY KEY (\`id\`)\n`;
  sql += `) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;\n\n`;

  // Tabla descansos_programados
  sql += `-- -----------------------------------------------------\n`;
  sql += `-- Tabla: descansos_programados\n`;
  sql += `-- -----------------------------------------------------\n`;
  sql += `CREATE TABLE \`descansos_programados\` (\n`;
  sql += `  \`id\` INT NOT NULL AUTO_INCREMENT,\n`;
  sql += `  \`trabajador_id\` INT NOT NULL,\n`;
  sql += `  \`fecha_inicio\` DATE NOT NULL,\n`;
  sql += `  \`fecha_fin\` DATE NOT NULL,\n`;
  sql += `  \`cantidad_dias\` INT NOT NULL,\n`;
  sql += `  \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n`;
  sql += `  \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),\n`;
  sql += `  PRIMARY KEY (\`id\`),\n`;
  sql += `  INDEX \`descansos_programados_trabajador_id_fecha_inicio_fecha_fin_idx\` (\`trabajador_id\`, \`fecha_inicio\`, \`fecha_fin\`),\n`;
  sql += `  CONSTRAINT \`descansos_programados_trabajador_id_fkey\`\n`;
  sql += `    FOREIGN KEY (\`trabajador_id\`) REFERENCES \`trabajadores\` (\`id\`)\n`;
  sql += `    ON DELETE CASCADE ON UPDATE CASCADE\n`;
  sql += `) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;\n\n`;

  // Tabla excepciones
  sql += `-- -----------------------------------------------------\n`;
  sql += `-- Tabla: excepciones (Días vendidos VD y Permisos P)\n`;
  sql += `-- -----------------------------------------------------\n`;
  sql += `CREATE TABLE \`excepciones\` (\n`;
  sql += `  \`id\` INT NOT NULL AUTO_INCREMENT,\n`;
  sql += `  \`trabajador_id\` INT NOT NULL,\n`;
  sql += `  \`fecha\` DATE NOT NULL,\n`;
  sql += `  \`tipo\` ENUM('VENTA_DESCANSO', 'PERMISO') NOT NULL,\n`;
  sql += `  \`motivo\` VARCHAR(255) NULL,\n`;
  sql += `  \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n`;
  sql += `  \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),\n`;
  sql += `  PRIMARY KEY (\`id\`),\n`;
  sql += `  UNIQUE INDEX \`excepciones_trabajador_id_fecha_key\` (\`trabajador_id\`, \`fecha\`),\n`;
  sql += `  INDEX \`excepciones_fecha_tipo_idx\` (\`fecha\`, \`tipo\`),\n`;
  sql += `  CONSTRAINT \`excepciones_trabajador_id_fkey\`\n`;
  sql += `    FOREIGN KEY (\`trabajador_id\`) REFERENCES \`trabajadores\` (\`id\`)\n`;
  sql += `    ON DELETE CASCADE ON UPDATE CASCADE\n`;
  sql += `) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;\n\n`;

  // INSERT USUARIOS
  sql += `-- =====================================================\n`;
  sql += `-- CARGA DE USUARIOS (${usuarios.length} registros)\n`;
  sql += `-- =====================================================\n`;
  sql += `INSERT INTO \`usuarios\` (\`id\`, \`email\`, \`username\`, \`password\`, \`nombres\`, \`rol\`, \`estado\`, \`aprobado_en\`) VALUES\n`;
  const userRows = usuarios.map(u => {
    const apDate = u.aprobadoEn ? `'${u.aprobadoEn.toISOString().slice(0, 19).replace('T', ' ')}'` : 'NULL';
    const usernameVal = u.username ? `'${escapeSql(u.username)}'` : 'NULL';
    return `(${u.id}, '${escapeSql(u.email)}', ${usernameVal}, '${u.password}', '${escapeSql(u.nombres)}', '${u.rol}', '${u.estado}', ${apDate})`;
  });
  sql += userRows.join(',\n') + ';\n\n';

  // INSERT TRABAJADORES
  sql += `-- =====================================================\n`;
  sql += `-- CARGA DE TRABAJADORES (${trabajadores.length} registros)\n`;
  sql += `-- =====================================================\n`;
  sql += `INSERT INTO \`trabajadores\` (\`id\`, \`nombres\`, \`area\`, \`activo\`) VALUES\n`;
  const trabRows = trabajadores.map(t => {
    return `(${t.id}, '${escapeSql(t.nombres)}', '${escapeSql(t.area)}', ${t.activo ? 1 : 0})`;
  });
  sql += trabRows.join(',\n') + ';\n\n';

  // INSERT DESCANSOS
  sql += `-- =====================================================\n`;
  sql += `-- CARGA DE DESCANSOS PROGRAMADOS (${descansos.length} registros)\n`;
  sql += `-- =====================================================\n`;
  sql += `INSERT INTO \`descansos_programados\` (\`id\`, \`trabajador_id\`, \`fecha_inicio\`, \`fecha_fin\`, \`cantidad_dias\`) VALUES\n`;
  const descRows = descansos.map(d => {
    return `(${d.id}, ${d.trabajadorId}, '${toSqlDate(d.fechaInicio)}', '${toSqlDate(d.fechaFin)}', ${d.cantidadDias})`;
  });
  sql += descRows.join(',\n') + ';\n\n';

  sql += `-- Fin del script de inicialización limpia.\n`;

  fs.writeFileSync('prisma/taller_mina_dump.sql', sql, 'utf8');
  console.log('Script taller_mina_dump.sql creado con éxito.');
}

dump().finally(() => prisma.$disconnect());
