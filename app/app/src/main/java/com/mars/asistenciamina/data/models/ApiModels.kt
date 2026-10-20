package com.mars.asistenciamina.data.models

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class EventoNotificacionDto(
    val id: String = "",
    val tipo: String = "", // 'INICIO_DESCANSO' | 'FIN_DESCANSO' | 'VENTA_ACTIVA' | 'PERMISO_ACTIVO'
    val trabajadorId: Int = 0,
    @SerialName("nombres") val trabajadorNombre: String = "",
    val area: String = "",
    @SerialName("fechaEvento") val fecha: String = "",
    val diasRestantes: Int = 0,
    val descripcion: String = "",
    val titulo: String = "",
    val esHoy: Boolean = false
)

@Serializable
data class ResumenNotificacionesDto(
    @SerialName("totalEventos") val total: Int = 0,
    val hoy: Int = 0,
    @SerialName("iniciosDescanso") val inicianDescansoProximos: Int = 0,
    @SerialName("finesDescanso") val retornanTrabajoProximos: Int = 0,
    @SerialName("ventas") val ventasOPermisosActivos: Int = 0
)

@Serializable
data class ProximosTurnosResponse(
    val success: Boolean = true,
    val fechaReferencia: String = "",
    val diasVentana: Int = 7,
    @SerialName("estadisticas") val resumen: ResumenNotificacionesDto = ResumenNotificacionesDto(),
    val descartadas: List<String> = emptyList(),
    @SerialName("data") val eventos: List<EventoNotificacionDto> = emptyList()
)

@Serializable
data class DescartarNotificacionesRequest(
    val ids: List<String>? = null,
    val id: String? = null
)

@Serializable
data class GenericApiResponse(
    val success: Boolean = true,
    val message: String? = null
)

@Serializable
data class DescansoDto(
    val id: Int = 0,
    val anio: Int = 2026,
    val cicloNro: Int = 1,
    val fechaInicio: String = "",
    val fechaFin: String = "",
    @SerialName("cantidadDias") val diasTotales: Int = 10
)

@Serializable
data class TrabajadorDto(
    val id: Int = 0,
    val nombres: String = "",
    val area: String = "",
    @SerialName("activo") val activo: Boolean = true,
    val fechaInicioTrabajo: String? = null,
    @SerialName("descansosProgramados") val descansos: List<DescansoDto> = emptyList()
)

@Serializable
data class TrabajadoresListResponse(
    val success: Boolean = true,
    val data: List<TrabajadorDto> = emptyList()
)

@Serializable
data class GrillaResponse(
    val success: Boolean = true,
    val anio: Int = 2026,
    val totalTrabajadores: Int = 0,
    val trabajadores: List<TrabajadorDto> = emptyList()
)

@Serializable
data class ExcepcionRangoRequest(
    val trabajadorId: Int,
    val fechas: List<String>,
    val tipo: String, // 'VENTA_DESCANSO' | 'PERMISO'
    val motivo: String? = null,
    val observacion: String? = null
)

@Serializable
data class ExcepcionRangoResponse(
    val success: Boolean = true,
    val message: String = "",
    @SerialName("total") val agregados: Int = 0
)

@Serializable
data class LoginRequest(
    val identificador: String,
    val password: String
)

@Serializable
data class UsuarioDto(
    val id: Int = 0,
    val email: String = "",
    val username: String? = null,
    val nombres: String = "",
    val rol: String = "TRABAJADOR"
)

@Serializable
data class LoginData(
    val token: String = "",
    val usuario: UsuarioDto = UsuarioDto()
)

@Serializable
data class LoginResponse(
    val success: Boolean = false,
    val data: LoginData? = null,
    val message: String? = null,
    val error: String? = null
)
