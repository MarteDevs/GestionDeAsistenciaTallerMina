package com.mars.asistenciamina.data.api

import com.mars.asistenciamina.data.models.ActualizarTrabajadorRequest
import com.mars.asistenciamina.data.models.DescartarNotificacionesRequest
import com.mars.asistenciamina.data.models.EliminarExcepcionesRequest
import com.mars.asistenciamina.data.models.GenericApiResponse
import com.mars.asistenciamina.data.models.ExcepcionRangoRequest
import com.mars.asistenciamina.data.models.ExcepcionRangoResponse
import com.mars.asistenciamina.data.models.GrillaResponse
import com.mars.asistenciamina.data.models.LoginRequest
import com.mars.asistenciamina.data.models.LoginResponse
import com.mars.asistenciamina.data.models.ProximosTurnosResponse
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.HTTP
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

import com.mars.asistenciamina.data.models.TrabajadoresListResponse

interface AsistenciaApiService {

    @POST("auth/login")
    suspend fun login(
        @Body request: LoginRequest
    ): LoginResponse

    @GET("notificaciones/proximos-turnos")
    suspend fun getProximosTurnos(
        @Query("fechaReferencia") fechaReferencia: String? = null,
        @Query("diasVentana") diasVentana: Int = 7
    ): ProximosTurnosResponse

    @GET("trabajadores")
    suspend fun getTrabajadores(
        @Query("incluirInactivos") incluirInactivos: Boolean = false
    ): TrabajadoresListResponse

    @GET("programacion")
    suspend fun getProgramacion(
        @Query("anio") anio: Int = 2026
    ): GrillaResponse

    @POST("excepciones/rango")
    suspend fun registrarExcepcionRango(
        @Body request: ExcepcionRangoRequest
    ): ExcepcionRangoResponse

    @POST("notificaciones/descartar")
    suspend fun descartarNotificaciones(
        @Body request: DescartarNotificacionesRequest
    ): GenericApiResponse

    @POST("notificaciones/restaurar")
    suspend fun restaurarNotificaciones(): GenericApiResponse

    @PUT("trabajadores/{id}")
    suspend fun actualizarTrabajador(
        @Path("id") id: Int,
        @Body request: ActualizarTrabajadorRequest
    ): GenericApiResponse

    @HTTP(method = "DELETE", path = "excepciones", hasBody = true)
    suspend fun eliminarExcepciones(
        @Body request: EliminarExcepcionesRequest
    ): GenericApiResponse
}
