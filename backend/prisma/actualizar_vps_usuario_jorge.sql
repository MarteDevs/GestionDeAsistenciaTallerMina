-- ======================================================================
-- SCRIPT DE ACTUALIZACIÓN DE BASE DE DATOS PARA EL SERVIDOR VPS
-- Base de datos: taller_mina
-- Propósito: 
--   1. Agregar la columna 'username' a la tabla 'usuarios'
--   2. Crear/Actualizar el usuario administrador 'JORGE' con contraseña 'POLTAND1'
--   3. Asignar usernames a las cuentas existentes
-- ======================================================================

USE `taller_mina`;

-- 1. Agregar la columna 'username' de forma segura e idempotente si no existe
SET @col_exists = (
  SELECT COUNT(*) 
  FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'usuarios' 
    AND COLUMN_NAME = 'username'
);

SET @sql_add_col = IF(
  @col_exists = 0,
  'ALTER TABLE `usuarios` ADD COLUMN `username` VARCHAR(100) NULL AFTER `email`, ADD UNIQUE INDEX `usuarios_username_key` (`username`)',
  'SELECT "Columna username ya existe en tabla usuarios" AS info'
);

PREPARE stmt_col FROM @sql_add_col;
EXECUTE stmt_col;
DEALLOCATE PREPARE stmt_col;

-- 2. Insertar o actualizar el usuario Administrador JORGE
-- Contraseña en texto plano: 'POLTAND1'
-- Hash bcrypt (10 rounds): '$2b$10$1PQ76g7BayVLqL6JPXRnZeBiUT9jIgjHBnqV45P4BvfPAoxg1d65q'
INSERT INTO `usuarios` (
  `email`,
  `username`,
  `password`,
  `nombres`,
  `rol`,
  `estado`,
  `aprobado_en`,
  `created_at`,
  `updated_at`
) VALUES (
  'jorge@tallermina.com',
  'JORGE',
  '$2b$10$1PQ76g7BayVLqL6JPXRnZeBiUT9jIgjHBnqV45P4BvfPAoxg1d65q',
  'Jorge Polo Tandaypan',
  'ADMIN',
  'ACTIVO',
  NOW(),
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE
  `username` = 'JORGE',
  `password` = '$2b$10$1PQ76g7BayVLqL6JPXRnZeBiUT9jIgjHBnqV45P4BvfPAoxg1d65q',
  `nombres` = 'Jorge Polo Tandaypan',
  `rol` = 'ADMIN',
  `estado` = 'ACTIVO',
  `aprobado_en` = IFNULL(`aprobado_en`, NOW()),
  `updated_at` = NOW();

-- 3. Asignar usernames a cuentas por defecto si no los tienen
UPDATE `usuarios` 
SET `username` = 'ADMIN' 
WHERE `email` = 'admin@tallermina.com' AND (`username` IS NULL OR `username` = '');

UPDATE `usuarios` 
SET `username` = 'SUPERVISOR' 
WHERE `email` = 'supervisor@tallermina.com' AND (`username` IS NULL OR `username` = '');

-- 4. Verificación final de usuarios
SELECT `id`, `email`, `username`, `nombres`, `rol`, `estado`, `aprobado_en` 
FROM `usuarios`;
