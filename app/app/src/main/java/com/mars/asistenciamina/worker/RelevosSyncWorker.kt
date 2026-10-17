package com.mars.asistenciamina.worker

import android.content.Context
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.mars.asistenciamina.data.api.ApiClient
import com.mars.asistenciamina.data.local.SessionManager
import com.mars.asistenciamina.util.NotificationHelper
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class RelevosSyncWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        val context = applicationContext
        SessionManager.init(context)

        // Si el usuario no ha iniciado sesión, no hay token para consultar
        val token = SessionManager.getToken()
        if (token.isNullOrBlank()) {
            Log.d(TAG, "RelevosSyncWorker: Usuario no autenticado, omitiendo verificación de relevos.")
            return@withContext Result.success()
        }

        try {
            Log.d(TAG, "RelevosSyncWorker: Consultando relevos en segundo plano (Régimen 30x10)...")
            val response = ApiClient.apiService.getProximosTurnos(diasVentana = 7)
            val eventos = response.eventos

            if (eventos.isNotEmpty()) {
                // Actualizar caché para que la app tenga los datos listos aunque no haya señal después
                SessionManager.cacheTurnosResponse(response)

                // Disparar las alertas de guardia (Día 0 urgente con sonido especial, Día 1 y Día 2)
                NotificationHelper.notifyUpcomingShifts(context, eventos)
                Log.d(TAG, "RelevosSyncWorker: Se procesaron ${eventos.size} alertas de guardia exitosamente.")
            } else {
                Log.d(TAG, "RelevosSyncWorker: Sin novedades de relevo para los próximos días.")
            }

            Result.success()
        } catch (e: Exception) {
            Log.e(TAG, "RelevosSyncWorker: Error en sincronización en segundo plano: ${e.message}")
            if (runAttemptCount < 3) {
                Result.retry()
            } else {
                Result.success()
            }
        }
    }

    companion object {
        private const val TAG = "RelevosSyncWorker"
        const val WORK_NAME = "RelevosSyncWorkerPeriodic"
    }
}
