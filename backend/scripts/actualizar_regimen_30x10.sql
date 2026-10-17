-- ====================================================================
-- MIGRACIÓN DE BASE DE DATOS: ACTUALIZACIÓN A RÉGIMEN 30x10 (TALLER MINA)
-- ====================================================================

-- 1. Asegurar consistencia de base de datos activa
-- Nota: si tu base de datos se llama 'taller_mina', puedes descomentar la siguiente línea:
-- USE taller_mina;

-- 2. Normalizar áreas operativas oficiales: Solo 'Taller Mina' y 'Carpintería Externa'
UPDATE Trabajador 
SET area = 'Taller Mina' 
WHERE area != 'Carpintería Externa' OR area IS NULL;

-- 3. Eliminar cualquier registro de MARCO de forma segura y en cascada
DELETE FROM Excepcion 
WHERE trabajadorId IN (SELECT id FROM (SELECT id FROM Trabajador WHERE UPPER(nombres) LIKE '%MARCO%') AS t_marco);

DELETE FROM DescansoProgramado 
WHERE trabajadorId IN (SELECT id FROM (SELECT id FROM Trabajador WHERE UPPER(nombres) LIKE '%MARCO%') AS t_marco);

DELETE FROM Trabajador 
WHERE UPPER(nombres) LIKE '%MARCO%';

DELETE FROM Usuario 
WHERE UPPER(username) LIKE '%MARCO%' OR UPPER(nombres) LIKE '%MARCO%';

-- 4. Asegurar que todos los descansos programados tengan duración oficial de 10 días (Régimen 30x10)
UPDATE DescansoProgramado 
SET cantidadDias = 10 
WHERE cantidadDias IS NULL OR cantidadDias != 10;

-- 5. Confirmación de estado de colaboradores y descansos
SELECT 
    t.id, 
    t.nombres, 
    t.area, 
    t.activo,
    COUNT(dp.id) AS total_descansos_programados
FROM Trabajador t
LEFT JOIN DescansoProgramado dp ON dp.trabajadorId = t.id
GROUP BY t.id, t.nombres, t.area, t.activo
ORDER BY t.area ASC, t.nombres ASC;

-- ====================================================================
-- Fin del script de actualización
-- ====================================================================
