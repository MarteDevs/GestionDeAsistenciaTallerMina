-- ======================================================================
-- SCRIPT COMPLETO DE BASE DE DATOS: taller_mina
-- Motor: MySQL 8.0+ / 9.0+
-- Generado: 2026-10-15T04:03:00.020Z
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
  `username` VARCHAR(100) NULL,
  `password` VARCHAR(255) NOT NULL,
  `nombres` VARCHAR(150) NOT NULL,
  `rol` ENUM('ADMIN', 'SUPERVISOR', 'TRABAJADOR') NOT NULL DEFAULT 'SUPERVISOR',
  `estado` ENUM('PENDIENTE', 'ACTIVO', 'RECHAZADO') NOT NULL DEFAULT 'PENDIENTE',
  `aprobado_en` DATETIME NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `usuarios_email_key` (`email`),
  UNIQUE INDEX `usuarios_username_key` (`username`)
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
-- CARGA DE USUARIOS (4 registros)
-- =====================================================
INSERT INTO `usuarios` (`id`, `email`, `username`, `password`, `nombres`, `rol`, `estado`, `aprobado_en`) VALUES
(4, 'jorge@tallermina.com', 'JORGE', '$2b$10$EnkvCxQYD6TPO3etfv9jGOXdr2b.jVnSO9XWc9uY7QkHz4Y6Ca5ya', 'Jorge Polo Tandaypan', 'ADMIN', 'ACTIVO', '2026-10-15 04:02:35'),
(5, 'admin@tallermina.com', 'ADMIN', '$2b$10$eHWnUIGYpoFgUHswukiq/OaJEaWCeXfvnoNA8Lxd2.x8dFdXuUkva', 'Administrador General', 'ADMIN', 'ACTIVO', '2026-10-15 04:02:35'),
(6, 'supervisor@tallermina.com', 'SUPERVISOR', '$2b$10$eHWnUIGYpoFgUHswukiq/OaJEaWCeXfvnoNA8Lxd2.x8dFdXuUkva', 'Supervisor de Turno', 'SUPERVISOR', 'ACTIVO', '2026-10-15 04:02:35'),
(7, 'operador.nuevo@tallermina.com', 'OPERADOR', '$2b$10$eHWnUIGYpoFgUHswukiq/OaJEaWCeXfvnoNA8Lxd2.x8dFdXuUkva', 'Juan Nuevo (Solicitud Pendiente)', 'TRABAJADOR', 'PENDIENTE', NULL);

-- =====================================================
-- CARGA DE TRABAJADORES (13 registros)
-- =====================================================
INSERT INTO `trabajadores` (`id`, `nombres`, `area`, `activo`) VALUES
(19, 'MORALES MATOS EDITH', 'Taller Mina', 1),
(20, 'POLO TANDAYPAN JORGE', 'Taller Mina', 1),
(21, 'CELESTINO AGUILAR LARRY MOLL', 'Taller Mina', 1),
(22, 'BACA MORENO JUSTINIANO', 'Taller Mina', 1),
(23, 'REYES GERBACIO ALFREDO', 'Taller Mina', 1),
(24, 'CELESTINO AGUILAR MANUEL', 'Taller Mina', 1),
(25, 'NOGUERA MOLINA EDINSON JOSE', 'Taller Mina', 1),
(26, 'FASABI CASTILLO LUIS ALBERTO', 'Taller Mina', 1),
(27, 'ULLOA DOMINGUEZ YOSBIN JEINER', 'Taller Mina', 1),
(28, 'CAMPOS GELBERT YURI', 'Taller Mina', 1),
(29, 'HEBER NOÉ CUSTODIO RUIZ', 'Taller Mina', 1),
(30, 'MARITZA', 'Taller Mina', 1),
(31, 'PABLO ANTICONA', 'Carpintería Externa', 1);

-- =====================================================
-- CARGA DE DESCANSOS PROGRAMADOS (108 registros)
-- =====================================================
INSERT INTO `descansos_programados` (`id`, `trabajador_id`, `fecha_inicio`, `fecha_fin`, `cantidad_dias`) VALUES
(116, 19, '2026-01-16', '2026-01-25', 10),
(117, 19, '2026-02-25', '2026-03-06', 10),
(118, 19, '2026-04-06', '2026-04-15', 10),
(119, 19, '2026-05-16', '2026-05-25', 10),
(120, 19, '2026-06-25', '2026-07-04', 10),
(121, 19, '2026-08-04', '2026-08-13', 10),
(122, 19, '2026-09-13', '2026-09-22', 10),
(123, 19, '2026-10-23', '2026-11-01', 10),
(124, 19, '2026-12-02', '2026-12-11', 10),
(125, 20, '2026-01-03', '2026-01-12', 10),
(126, 20, '2026-02-12', '2026-02-21', 10),
(127, 20, '2026-03-24', '2026-04-02', 10),
(128, 20, '2026-05-03', '2026-05-12', 10),
(129, 20, '2026-06-12', '2026-06-21', 10),
(130, 20, '2026-07-22', '2026-07-31', 10),
(131, 20, '2026-08-31', '2026-09-09', 10),
(132, 20, '2026-10-10', '2026-10-19', 10),
(133, 20, '2026-11-19', '2026-11-28', 10),
(134, 20, '2026-12-29', '2027-01-07', 10),
(135, 21, '2026-01-30', '2026-02-08', 10),
(136, 21, '2026-03-11', '2026-03-20', 10),
(137, 21, '2026-04-20', '2026-04-29', 10),
(138, 21, '2026-05-30', '2026-06-08', 10),
(139, 21, '2026-07-09', '2026-07-18', 10),
(140, 21, '2026-08-18', '2026-08-27', 10),
(141, 21, '2026-09-27', '2026-10-06', 10),
(142, 21, '2026-11-06', '2026-11-15', 10),
(143, 21, '2026-12-16', '2026-12-25', 10),
(144, 22, '2026-01-07', '2026-01-16', 10),
(145, 22, '2026-02-16', '2026-02-25', 10),
(146, 22, '2026-03-28', '2026-04-06', 10),
(147, 22, '2026-05-07', '2026-05-16', 10),
(148, 22, '2026-06-16', '2026-06-25', 10),
(149, 22, '2026-07-26', '2026-08-04', 10),
(150, 22, '2026-09-04', '2026-09-13', 10),
(151, 22, '2026-10-14', '2026-10-23', 10),
(152, 22, '2026-11-23', '2026-12-02', 10),
(153, 23, '2026-01-26', '2026-02-04', 10),
(154, 23, '2026-03-07', '2026-03-16', 10),
(155, 23, '2026-04-16', '2026-04-25', 10),
(156, 23, '2026-05-26', '2026-06-04', 10),
(157, 23, '2026-07-05', '2026-07-14', 10),
(158, 23, '2026-08-14', '2026-08-23', 10),
(159, 23, '2026-09-23', '2026-10-02', 10),
(160, 23, '2026-11-02', '2026-11-11', 10),
(161, 23, '2026-12-12', '2026-12-21', 10),
(162, 25, '2026-01-18', '2026-01-27', 10),
(163, 25, '2026-02-27', '2026-03-08', 10),
(164, 25, '2026-04-08', '2026-04-17', 10),
(165, 25, '2026-05-18', '2026-05-27', 10),
(166, 25, '2026-06-27', '2026-07-06', 10),
(167, 25, '2026-08-06', '2026-08-15', 10),
(168, 25, '2026-09-15', '2026-09-24', 10),
(169, 25, '2026-10-25', '2026-11-03', 10),
(170, 25, '2026-12-04', '2026-12-13', 10),
(171, 26, '2026-02-04', '2026-02-13', 10),
(172, 26, '2026-03-16', '2026-03-25', 10),
(173, 26, '2026-04-25', '2026-05-04', 10),
(174, 26, '2026-06-04', '2026-06-13', 10),
(175, 26, '2026-07-14', '2026-07-23', 10),
(176, 26, '2026-08-23', '2026-09-01', 10),
(177, 26, '2026-10-02', '2026-10-11', 10),
(178, 26, '2026-11-11', '2026-11-20', 10),
(179, 26, '2026-12-21', '2026-12-30', 10),
(180, 27, '2026-01-09', '2026-01-18', 10),
(181, 27, '2026-02-18', '2026-02-27', 10),
(182, 27, '2026-03-30', '2026-04-08', 10),
(183, 27, '2026-05-09', '2026-05-18', 10),
(184, 27, '2026-06-18', '2026-06-27', 10),
(185, 27, '2026-07-28', '2026-08-06', 10),
(186, 27, '2026-09-06', '2026-09-15', 10),
(187, 27, '2026-10-16', '2026-10-25', 10),
(188, 27, '2026-11-25', '2026-12-04', 10),
(189, 28, '2026-04-16', '2026-04-25', 10),
(190, 28, '2026-05-26', '2026-06-04', 10),
(191, 28, '2026-07-05', '2026-07-14', 10),
(192, 28, '2026-08-14', '2026-08-23', 10),
(193, 28, '2026-09-23', '2026-10-02', 10),
(194, 28, '2026-11-02', '2026-11-11', 10),
(195, 28, '2026-12-12', '2026-12-21', 10),
(196, 29, '2026-01-02', '2026-01-11', 10),
(197, 29, '2026-02-11', '2026-02-20', 10),
(198, 29, '2026-03-23', '2026-04-01', 10),
(199, 29, '2026-05-02', '2026-05-11', 10),
(200, 29, '2026-06-11', '2026-06-20', 10),
(201, 29, '2026-07-21', '2026-07-30', 10),
(202, 29, '2026-08-30', '2026-09-08', 10),
(203, 29, '2026-10-09', '2026-10-18', 10),
(204, 29, '2026-11-18', '2026-11-27', 10),
(205, 29, '2026-12-28', '2027-01-06', 10),
(206, 30, '2026-02-14', '2026-02-23', 10),
(207, 30, '2026-03-26', '2026-04-04', 10),
(208, 30, '2026-05-05', '2026-05-14', 10),
(209, 30, '2026-06-14', '2026-06-23', 10),
(210, 30, '2026-07-24', '2026-08-02', 10),
(211, 30, '2026-09-02', '2026-09-11', 10),
(212, 30, '2026-10-12', '2026-10-21', 10),
(213, 30, '2026-11-21', '2026-11-30', 10),
(214, 30, '2026-12-31', '2027-01-09', 10),
(215, 31, '2026-01-25', '2026-02-03', 10),
(216, 31, '2026-03-06', '2026-03-15', 10),
(217, 31, '2026-04-15', '2026-04-24', 10),
(218, 31, '2026-05-25', '2026-06-03', 10),
(219, 31, '2026-07-04', '2026-07-13', 10),
(220, 31, '2026-08-13', '2026-08-22', 10),
(221, 31, '2026-09-22', '2026-10-01', 10),
(222, 31, '2026-11-01', '2026-11-10', 10),
(223, 31, '2026-12-11', '2026-12-20', 10);

-- Fin del script de inicialización limpia.
