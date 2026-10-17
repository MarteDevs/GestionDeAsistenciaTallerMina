-- ==============================================================================
-- SCRIPT DE MIGRACIÓN: ACTUALIZACIÓN A RÉGIMEN 30x10 (TALLER MINA)
-- Base de datos: taller_mina
-- Motor: MySQL 8.0+ / MariaDB (Linux Case-Sensitive Compatible)
-- ==============================================================================

USE `taller_mina`;

-- 1. Normalizar áreas operativas oficiales: Solo 'Taller Mina' y 'Carpintería Externa'
UPDATE `trabajadores` 
SET `area` = 'Taller Mina' 
WHERE `area` != 'Carpintería Externa' OR `area` IS NULL;

-- 2. Eliminar cualquier registro residual de MARCO de forma segura y en cascada
DELETE dp FROM `descansos_programados` dp
INNER JOIN `trabajadores` t ON dp.`trabajador_id` = t.`id`
WHERE UPPER(t.`nombres`) LIKE '%MARCO%';

DELETE exc FROM `excepciones` exc
INNER JOIN `trabajadores` t ON exc.`trabajador_id` = t.`id`
WHERE UPPER(t.`nombres`) LIKE '%MARCO%';

DELETE FROM `trabajadores` 
WHERE UPPER(`nombres`) LIKE '%MARCO%';

DELETE FROM `usuarios` 
WHERE UPPER(`username`) LIKE '%MARCO%' OR UPPER(`nombres`) LIKE '%MARCO%';

-- 3. Asegurar que todos los descansos programados tengan duración oficial de 10 días (Régimen 30x10)
UPDATE `descansos_programados` 
SET `cantidad_dias` = 10 
WHERE `cantidad_dias` IS NULL OR `cantidad_dias` != 10;

-- 4. Confirmación de estado de colaboradores y descansos
SELECT 'Personal actual y estado en Régimen 30x10:' AS `Estado`;
SELECT 
    t.`id`, 
    t.`nombres`, 
    t.`area`, 
    t.`activo`,
    COUNT(dp.`id`) AS `total_descansos_programados`
FROM `trabajadores` t
LEFT JOIN `descansos_programados` dp ON dp.`trabajador_id` = t.`id`
GROUP BY t.`id`, t.`nombres`, t.`area`, t.`activo`
ORDER BY t.`area` ASC, t.`nombres` ASC;

-- 5. Conteo agrupado por área
SELECT `area`, COUNT(*) AS `total_trabajadores`
FROM `trabajadores`
GROUP BY `area`;

-- ==============================================================================
-- Fin del script de actualización 30x10
-- ==============================================================================
