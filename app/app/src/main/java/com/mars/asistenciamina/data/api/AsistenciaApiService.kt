package com.mars.asistenciamina.data.api

import com.mars.asistenciamina.data.models.ExcepcionRangoRequest
import com.mars.asistenciamina.data.models.ExcepcionRangoResponse
import com.mars.asistenciamina.data.models.GrillaResponse
import com.mars.asistenciamina.data.models.ProximosTurnosResponse
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Query

interface AsistenciaApiService {

    @GET("notificaciones/proximos-turnos")
    suspend fun getProximosTurnos(
        @Query("fechaReferencia") fechaReferencia: String? = null,
        @Query("diasVentana") diasVentana: Int = 7
    ): ProximosTurnosResponse

    @GET("programacion")
    suspend fun getProgramacion(
        @Query("anio") anio: Int = 2026
    ): GrillaResponse

    @POST("excepciones/rango")
    suspend fun registrarExcepcionRango(
        @Body request: ExcepcionRangoRequest
    ): ExcepcionRangoResponse
}
