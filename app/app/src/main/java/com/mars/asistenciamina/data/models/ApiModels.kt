package com.mars.asistenciamina.data.models

import kotlinx.serialization.Serializable

@Serializable
data class EventoNotificacionDto(
    val trabajadorId: Int,
    val trabajadorNombre: String,
    val tipo: String, // 'INICIO_DESCANSO' | 'FIN_DESCANSO' | 'VENTA_ACTIVA' | 'PERMISO_ACTIVO'
    val titulo: String,
    val descripcion: String,
    val fecha: String,
    val diasRestantes: Int,
    val esHoy: Boolean
)

@Serializable
data class ResumenNotificacionesDto(
    val total: Int,
    val hoy: Int,
    val inicianDescansoProximos: Int,
    val retornanTrabajoProximos: Int,
    val ventasOPermisosActivos: Int
)

@Serializable
data class ProximosTurnosResponse(
    val status: String,
    val fechaReferencia: String,
    val diasVentana: Int,
    val resumen: ResumenNotificacionesDto,
    val eventos: List<EventoNotificacionDto>
)

@Serializable
data class TrabajadorDto(
    val id: Int,
    val nombres: String,
    val cargo: String? = null,
    val estado: String? = "ACTIVO",
    val fechaInicioTrabajo: String? = null,
    val descansos: List<DescansoDto> = emptyList()
)

@Serializable
data class DescansoDto(
    val id: Int,
    val anio: Int,
    val cicloNro: Int,
    val fechaInicio: String,
    val fechaFin: String,
    val diasTotales: Int
)

@Serializable
data class GrillaResponse(
    val status: String,
    val anio: Int,
    val totalTrabajadores: Int,
    val trabajadores: List<TrabajadorDto>
)

@Serializable
data class ExcepcionRangoRequest(
    val trabajadorId: Int,
    val fechas: List<String>,
    val tipo: String, // 'VENTA_DESCANSO' | 'PERMISO'
    val observacion: String? = null
)

@Serializable
data class ExcepcionRangoResponse(
    val status: String,
    val message: String,
    val agregados: Int
)
