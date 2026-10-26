-- Script para agregar el rol 'SECRETARIA' al enum de la tabla usuarios en VPS
ALTER TABLE usuarios MODIFY COLUMN rol ENUM('ADMIN', 'SUPERVISOR', 'SECRETARIA', 'TRABAJADOR') NOT NULL DEFAULT 'SUPERVISOR';
