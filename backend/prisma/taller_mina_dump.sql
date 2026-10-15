-- ======================================================================
-- SCRIPT COMPLETO DE BASE DE DATOS: taller_mina
-- Motor: MySQL 8.0+ / 9.0+
-- Generado: 2026-10-15T02:33:25.014Z
-- Incluye: DDL estructurado + Carga de Usuarios y 13 Trabajadores 2026
-- NOTA: Las excepciones (días vendidos/permisos) se inician limpias en cero.
-- ======================================================================

CREATE DATABASE IF NOT EXISTS `taller_mina`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `taller_mina`;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `excepciones`;
DROP TABLE IF EXISTS `descansos_programados`;
DROP TABLE IF EXISTS `trabajadores`;
DROP TABLE IF EXISTS `usuarios`;
SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------
-- Tabla: usuarios
-- -----------------------------------------------------
CREATE TABLE `usuarios` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(150) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `nombres` VARCHAR(150) NOT NULL,
  `rol` ENUM('ADMIN', 'SUPERVISOR', 'TRABAJADOR') NOT NULL DEFAULT 'SUPERVISOR',
  `estado` ENUM('PENDIENTE', 'ACTIVO', 'RECHAZADO') NOT NULL DEFAULT 'PENDIENTE',
  `aprobado_en` DATETIME NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `usuarios_email_key` (`email`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Tabla: trabajadores
-- -----------------------------------------------------
CREATE TABLE `trabajadores` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombres` VARCHAR(150) NOT NULL,
  `area` VARCHAR(100) NOT NULL,
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Tabla: descansos_programados
-- -----------------------------------------------------
CREATE TABLE `descansos_programados` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `trabajador_id` INT NOT NULL,
  `fecha_inicio` DATE NOT NULL,
  `fecha_fin` DATE NOT NULL,
  `cantidad_dias` INT NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `descansos_programados_trabajador_id_fecha_inicio_fecha_fin_idx` (`trabajador_id`, `fecha_inicio`, `fecha_fin`),
  CONSTRAINT `descansos_programados_trabajador_id_fkey`
    FOREIGN KEY (`trabajador_id`) REFERENCES `trabajadores` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Tabla: excepciones (Días vendidos VD y Permisos P)
-- -----------------------------------------------------
CREATE TABLE `excepciones` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `trabajador_id` INT NOT NULL,
  `fecha` DATE NOT NULL,
  `tipo` ENUM('VENTA_DESCANSO', 'PERMISO') NOT NULL,
  `motivo` VARCHAR(255) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `excepciones_trabajador_id_fecha_key` (`trabajador_id`, `fecha`),
  INDEX `excepciones_fecha_tipo_idx` (`fecha`, `tipo`),
  CONSTRAINT `excepciones_trabajador_id_fkey`
    FOREIGN KEY (`trabajador_id`) REFERENCES `trabajadores` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- =====================================================
-- CARGA DE USUARIOS (3 registros)
-- Passwords originales: 'admin123'
-- =====================================================
INSERT INTO `usuarios` (`id`, `email`, `password`, `nombres`, `rol`, `estado`, `aprobado_en`) VALUES
(1, 'admin@tallermina.com', '$2b$10$tTOXIXQNg3WnSidpuySD.OXJa5ZRYCTfNaSqhZ9YkbqUhEQQ532K6', 'Administrador General', 'ADMIN', 'ACTIVO', '2026-10-09 15:51:23'),
(2, 'supervisor@tallermina.com', '$2b$10$tTOXIXQNg3WnSidpuySD.OXJa5ZRYCTfNaSqhZ9YkbqUhEQQ532K6', 'Supervisor de Turno', 'SUPERVISOR', 'ACTIVO', '2026-10-09 15:51:23'),
(3, 'operador.nuevo@tallermina.com', '$2b$10$tTOXIXQNg3WnSidpuySD.OXJa5ZRYCTfNaSqhZ9YkbqUhEQQ532K6', 'Juan Nuevo (Solicitud Pendiente)', 'TRABAJADOR', 'ACTIVO', '2026-10-09 16:07:49');

-- =====================================================
-- CARGA DE TRABAJADORES (14 registros)
-- =====================================================
INSERT INTO `trabajadores` (`id`, `nombres`, `area`, `activo`) VALUES
(5, 'MORALES MATOS EDITH', 'Taller Carpintería Principal', 1),
(6, 'POLO TANDAYPAN JORGE', 'Taller Carpintería Principal', 1),
(7, 'CELESTINO AGUILAR LARRY MOLL', 'Taller Carpintería Principal', 1),
(8, 'BACA MORENO JUSTINIANO', 'Taller Carpintería Principal', 1),
(9, 'REYES GERBACIO ALFREDO', 'Taller Carpintería Principal', 1),
(10, 'CELESTINO AGUILAR MANUEL', 'Taller Carpintería Principal', 1),
(11, 'NOGUERA MOLINA EDINSON JOSE', 'Taller Carpintería Principal', 1),
(12, 'FASABI CASTILLO LUIS ALBERTO', 'Taller Carpintería Principal', 1),
(13, 'ULLOA DOMINGUEZ YOSBIN JEINER', 'Taller Carpintería Principal', 1),
(14, 'CAMPOS GELBERT YURI', 'Taller Carpintería Principal', 1),
(15, 'HEBER NOÉ CUSTODIO RUIZ', 'Taller Carpintería Principal', 1),
(16, 'MARITZA', 'Taller Carpintería Principal', 1),
(17, 'PABLO ANTICONA', 'Carpintería Externa', 1),
(18, 'MARCO', 'Taller Carpintería Principal', 1);

-- =====================================================
-- CARGA DE DESCANSOS PROGRAMADOS (111 registros)
-- =====================================================
INSERT INTO `descansos_programados` (`id`, `trabajador_id`, `fecha_inicio`, `fecha_fin`, `cantidad_dias`) VALUES
(5, 5, '2026-01-16', '2026-01-25', 10),
(6, 5, '2026-02-25', '2026-03-06', 10),
(7, 5, '2026-04-06', '2026-04-15', 10),
(8, 5, '2026-05-16', '2026-05-25', 10),
(9, 5, '2026-06-25', '2026-07-04', 10),
(10, 5, '2026-08-04', '2026-08-13', 10),
(11, 5, '2026-09-13', '2026-09-22', 10),
(12, 5, '2026-10-23', '2026-11-01', 10),
(13, 5, '2026-12-02', '2026-12-11', 10),
(14, 6, '2026-01-03', '2026-01-12', 10),
(15, 6, '2026-02-12', '2026-02-21', 10),
(16, 6, '2026-03-24', '2026-04-02', 10),
(17, 6, '2026-05-03', '2026-05-12', 10),
(18, 6, '2026-06-12', '2026-06-21', 10),
(19, 6, '2026-07-22', '2026-07-31', 10),
(20, 6, '2026-08-31', '2026-09-09', 10),
(21, 6, '2026-10-10', '2026-10-19', 10),
(22, 6, '2026-11-19', '2026-11-28', 10),
(23, 6, '2026-12-29', '2027-01-07', 10),
(24, 7, '2026-01-30', '2026-02-08', 10),
(25, 7, '2026-03-11', '2026-03-20', 10),
(26, 7, '2026-04-20', '2026-04-29', 10),
(27, 7, '2026-05-30', '2026-06-08', 10),
(28, 7, '2026-07-09', '2026-07-18', 10),
(29, 7, '2026-08-18', '2026-08-27', 10),
(30, 7, '2026-09-27', '2026-10-06', 10),
(31, 7, '2026-11-06', '2026-11-15', 10),
(32, 7, '2026-12-16', '2026-12-25', 10),
(33, 8, '2026-01-07', '2026-01-16', 10),
(34, 8, '2026-02-16', '2026-02-25', 10),
(35, 8, '2026-03-28', '2026-04-06', 10),
(36, 8, '2026-05-07', '2026-05-16', 10),
(37, 8, '2026-06-16', '2026-06-25', 10),
(38, 8, '2026-07-26', '2026-08-04', 10),
(39, 8, '2026-09-04', '2026-09-13', 10),
(40, 8, '2026-10-14', '2026-10-23', 10),
(41, 8, '2026-11-23', '2026-12-02', 10),
(42, 9, '2026-01-26', '2026-02-04', 10),
(43, 9, '2026-03-07', '2026-03-16', 10),
(44, 9, '2026-04-16', '2026-04-25', 10),
(45, 9, '2026-05-26', '2026-06-04', 10),
(46, 9, '2026-07-05', '2026-07-14', 10),
(47, 9, '2026-08-14', '2026-08-23', 10),
(48, 9, '2026-09-23', '2026-10-02', 10),
(49, 9, '2026-11-02', '2026-11-11', 10),
(50, 9, '2026-12-12', '2026-12-21', 10),
(51, 11, '2026-01-18', '2026-01-27', 10),
(52, 11, '2026-02-27', '2026-03-08', 10),
(53, 11, '2026-04-08', '2026-04-17', 10),
(54, 11, '2026-05-18', '2026-05-27', 10),
(55, 11, '2026-06-27', '2026-07-06', 10),
(56, 11, '2026-08-06', '2026-08-15', 10),
(57, 11, '2026-09-15', '2026-09-24', 10),
(58, 11, '2026-10-25', '2026-11-03', 10),
(59, 11, '2026-12-04', '2026-12-13', 10),
(60, 12, '2026-02-04', '2026-02-13', 10),
(61, 12, '2026-03-16', '2026-03-25', 10),
(62, 12, '2026-04-25', '2026-05-04', 10),
(63, 12, '2026-06-04', '2026-06-13', 10),
(64, 12, '2026-07-14', '2026-07-23', 10),
(65, 12, '2026-08-23', '2026-09-01', 10),
(66, 12, '2026-10-02', '2026-10-11', 10),
(67, 12, '2026-11-11', '2026-11-20', 10),
(68, 12, '2026-12-21', '2026-12-30', 10),
(69, 13, '2026-01-09', '2026-01-18', 10),
(70, 13, '2026-02-18', '2026-02-27', 10),
(71, 13, '2026-03-30', '2026-04-08', 10),
(72, 13, '2026-05-09', '2026-05-18', 10),
(73, 13, '2026-06-18', '2026-06-27', 10),
(74, 13, '2026-07-28', '2026-08-06', 10),
(75, 13, '2026-09-06', '2026-09-15', 10),
(76, 13, '2026-10-16', '2026-10-25', 10),
(77, 13, '2026-11-25', '2026-12-04', 10),
(78, 14, '2026-04-16', '2026-04-25', 10),
(79, 14, '2026-05-26', '2026-06-04', 10),
(80, 14, '2026-07-05', '2026-07-14', 10),
(81, 14, '2026-08-14', '2026-08-23', 10),
(82, 14, '2026-09-23', '2026-10-02', 10),
(83, 14, '2026-11-02', '2026-11-11', 10),
(84, 14, '2026-12-12', '2026-12-21', 10),
(85, 15, '2026-01-02', '2026-01-11', 10),
(86, 15, '2026-02-11', '2026-02-20', 10),
(87, 15, '2026-03-23', '2026-04-01', 10),
(88, 15, '2026-05-02', '2026-05-11', 10),
(89, 15, '2026-06-11', '2026-06-20', 10),
(90, 15, '2026-07-21', '2026-07-30', 10),
(91, 15, '2026-08-30', '2026-09-08', 10),
(92, 15, '2026-10-09', '2026-10-18', 10),
(93, 15, '2026-11-18', '2026-11-27', 10),
(94, 15, '2026-12-28', '2027-01-06', 10),
(95, 16, '2026-02-14', '2026-02-23', 10),
(96, 16, '2026-03-26', '2026-04-04', 10),
(97, 16, '2026-05-05', '2026-05-14', 10),
(98, 16, '2026-06-14', '2026-06-23', 10),
(99, 16, '2026-07-24', '2026-08-02', 10),
(100, 16, '2026-09-02', '2026-09-11', 10),
(101, 16, '2026-10-12', '2026-10-21', 10),
(102, 16, '2026-11-21', '2026-11-30', 10),
(103, 16, '2026-12-31', '2027-01-09', 10),
(104, 17, '2026-01-25', '2026-02-03', 10),
(105, 17, '2026-03-06', '2026-03-15', 10),
(106, 17, '2026-04-15', '2026-04-24', 10),
(107, 17, '2026-05-25', '2026-06-03', 10),
(108, 17, '2026-07-04', '2026-07-13', 10),
(109, 17, '2026-08-13', '2026-08-22', 10),
(110, 17, '2026-09-22', '2026-10-01', 10),
(111, 17, '2026-11-01', '2026-11-10', 10),
(112, 17, '2026-12-11', '2026-12-20', 10),
(113, 18, '2026-10-29', '2026-11-07', 10),
(114, 18, '2026-11-28', '2026-12-07', 10),
(115, 18, '2026-12-28', '2027-01-06', 10);

-- Fin del script de inicialización limpia.
