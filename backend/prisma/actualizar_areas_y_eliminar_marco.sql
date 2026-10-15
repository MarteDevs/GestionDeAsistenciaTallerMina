-- ==============================================================================
-- SCRIPT DE MIGRACIÓN: ACTUALIZAR ÁREAS Y ELIMINAR TRABAJADOR MARCO
-- Base de datos: taller_mina
-- Motor: MySQL 8.0+ / MariaDB
--
-- Acciones realizadas:
--   1. Localizar y eliminar al trabajador 'MARCO' (y cualquier registro en cascada:
--      descansos programados y excepciones).
--   2. Si existe algún usuario de acceso con username o nombres 'MARCO', eliminarlo.
--   3. Normalizar todas las áreas para que únicamente existan:
--        - 'Taller Mina'
--        - 'Carpintería Externa'
--   4. Emitir un reporte final de comprobación.
-- ==============================================================================

USE `taller_mina`;

-- 1. Diagnóstico previo
SELECT 'Trabajadores con nombre MARCO antes de la eliminación:' AS `Estado`;
SELECT `id`, `nombres`, `area`, `activo` FROM `trabajadores` WHERE UPPER(`nombres`) LIKE '%MARCO%';

-- 2. Eliminar descansos programados de Marco (seguridad ante FKs)
DELETE dp FROM `descansos_programados` dp
INNER JOIN `trabajadores` t ON dp.trabajador_id = t.id
WHERE UPPER(t.nombres) LIKE '%MARCO%';

-- 3. Eliminar excepciones de Marco
DELETE exc FROM `excepciones` exc
INNER JOIN `trabajadores` t ON exc.trabajador_id = t.id
WHERE UPPER(t.nombres) LIKE '%MARCO%';

-- 4. Eliminar trabajador Marco
DELETE FROM `trabajadores`
WHERE UPPER(`nombres`) LIKE '%MARCO%';

-- 5. Eliminar usuario Marco en caso de existir
DELETE FROM `usuarios`
WHERE UPPER(`username`) LIKE '%MARCO%' OR UPPER(`nombres`) LIKE '%MARCO%';

-- 6. Actualizar todas las áreas de trabajadores que no sean 'Carpintería Externa' a 'Taller Mina'
UPDATE `trabajadores`
SET `area` = 'Taller Mina'
WHERE `area` != 'Carpintería Externa';

-- 7. Reporte final: Lista de todos los trabajadores
SELECT 'Personal actual y áreas normalizadas:' AS `Estado`;
SELECT 
    t.`id`, 
    t.`nombres`, 
    t.`area`, 
    t.`activo`,
    (SELECT COUNT(*) FROM `descansos_programados` dp WHERE dp.trabajador_id = t.id) AS `total_descansos`,
    (SELECT COUNT(*) FROM `excepciones` exc WHERE exc.trabajador_id = t.id) AS `total_excepciones`
FROM `trabajadores` t
ORDER BY t.`area` ASC, t.`nombres` ASC;

-- 8. Conteo agrupado por área
SELECT `area`, COUNT(*) AS `total_trabajadores`
FROM `trabajadores`
GROUP BY `area`;
