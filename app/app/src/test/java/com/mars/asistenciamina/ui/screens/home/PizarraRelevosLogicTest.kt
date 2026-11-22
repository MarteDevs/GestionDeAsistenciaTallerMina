package com.mars.asistenciamina.ui.screens.home

import com.mars.asistenciamina.data.models.DescansoDto
import com.mars.asistenciamina.data.models.TrabajadorDto
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import java.time.LocalDate

/**
 * Cubre la selección de periodo vigente para el tablero tipo pizarra del dashboard móvil:
 * debe preferir el descanso activo hoy, luego el próximo futuro, y nunca uno ya cerrado.
 */
class PizarraRelevosLogicTest {

    private fun descanso(inicio: String, fin: String) = DescansoDto(fechaInicio = inicio, fechaFin = fin)

    private val hoy = LocalDate.of(2026, 11, 17)

    @Test
    fun `prefiere el descanso activo hoy sobre uno futuro`() {
        val trabajador = TrabajadorDto(
            id = 1,
            nombres = "YURI",
            area = "Taller Mina",
            descansos = listOf(
                descanso("2026-11-12", "2026-11-21"),
                descanso("2026-12-21", "2026-12-30")
            )
        )

        val fila = obtenerFilaWhiteboard(trabajador, hoy)

        requireNotNull(fila)
        assertEquals(LocalDate.of(2026, 11, 12), fila.inicio)
        assertEquals(LocalDate.of(2026, 11, 21), fila.fin)
        assertEquals(LocalDate.of(2026, 11, 22), fila.ingresa)
        assertEquals(true, fila.enDescanso)
    }

    @Test
    fun `sin descanso activo usa el proximo futuro mas cercano`() {
        val trabajador = TrabajadorDto(
            id = 2,
            nombres = "LUIS",
            area = "Taller Mina",
            descansos = listOf(
                descanso("2026-12-21", "2026-12-30"),
                descanso("2026-11-20", "2026-11-29")
            )
        )

        val fila = obtenerFilaWhiteboard(trabajador, hoy)

        requireNotNull(fila)
        assertEquals(LocalDate.of(2026, 11, 20), fila.inicio)
        assertEquals(LocalDate.of(2026, 11, 29), fila.fin)
        assertEquals(false, fila.enDescanso)
    }

    @Test
    fun `el dia de retorno mantiene visible el descanso recien terminado`() {
        val trabajador = TrabajadorDto(
            id = 4,
            nombres = "HEBER",
            area = "Taller Mina",
            descansos = listOf(
                descanso("2026-11-07", "2026-11-16"),
                descanso("2026-12-20", "2026-12-29")
            )
        )

        val fila = obtenerFilaWhiteboard(trabajador, hoy)

        requireNotNull(fila)
        assertEquals(LocalDate.of(2026, 11, 7), fila.inicio)
        assertEquals(LocalDate.of(2026, 11, 16), fila.fin)
        assertEquals(hoy, fila.ingresa)
        assertEquals(false, fila.enDescanso)
    }

    @Test
    fun `sin periodos activos ni futuros no genera fila`() {
        val trabajador = TrabajadorDto(
            id = 3,
            nombres = "SIN CICLOS",
            area = "Taller Mina",
            descansos = listOf(descanso("2026-01-01", "2026-01-10"))
        )

        assertNull(obtenerFilaWhiteboard(trabajador, hoy))
    }

    @Test
    fun `formatea la fecha igual que la pizarra fisica`() {
        assertEquals("02-Nov", formatearFechaPizarra(LocalDate.of(2026, 11, 2)))
        assertEquals("05-Dic", formatearFechaPizarra(LocalDate.of(2026, 12, 5)))
    }

    @Test
    fun `ingresa proximo solo es verdadero hoy o manana, nunca antes ni despues`() {
        val fila = FilaWhiteboard(
            trabajadorId = 1, nombres = "X", area = "Taller Mina",
            inicio = hoy, fin = hoy, ingresa = hoy, enDescanso = true
        )
        assertEquals(true, esIngresaProximo(fila.copy(ingresa = hoy), hoy))
        assertEquals(true, esIngresaProximo(fila.copy(ingresa = hoy.plusDays(1)), hoy))
        assertEquals(false, esIngresaProximo(fila.copy(ingresa = hoy.plusDays(2)), hoy))
        assertEquals(false, esIngresaProximo(fila.copy(ingresa = hoy.minusDays(1)), hoy))
    }
}
