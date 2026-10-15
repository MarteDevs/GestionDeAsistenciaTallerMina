package com.mars.asistenciamina.util

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.mars.asistenciamina.MainActivity
import com.mars.asistenciamina.data.models.EventoNotificacionDto

object NotificationHelper {
    const val CHANNEL_ID = "relevos_turnos_mina"
    const val CHANNEL_NAME = "Relevos y Turnos Mina"
    const val CHANNEL_DESC = "Notificaciones de relevos, salidas a descanso y retornos a mina"

    fun createNotificationChannel(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val importance = NotificationManager.IMPORTANCE_HIGH
            val channel = NotificationChannel(CHANNEL_ID, CHANNEL_NAME, importance).apply {
                description = CHANNEL_DESC
                enableLights(true)
                enableVibration(true)
            }
            val notificationManager: NotificationManager =
                context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }

    fun hasNotificationPermission(context: Context): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
        } else {
            true
        }
    }

    fun sendShiftNotification(
        context: Context,
        notificationId: Int,
        title: String,
        message: String
    ) {
        if (!hasNotificationPermission(context)) return

        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        val pendingIntent: PendingIntent = PendingIntent.getActivity(
            context,
            notificationId,
            intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val builder = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(message)
            .setStyle(NotificationCompat.BigTextStyle().bigText(message))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)

        try {
            NotificationManagerCompat.from(context).notify(notificationId, builder.build())
        } catch (e: SecurityException) {
            // Permiso no concedido por el usuario
        }
    }

    /**
     * Revisa los eventos recibidos y envía notificaciones automáticas para
     * los colaboradores que salen hoy o están próximos a salir (1 día).
     */
    fun notifyUpcomingShifts(context: Context, eventos: List<EventoNotificacionDto>) {
        if (!hasNotificationPermission(context)) return

        // 1. Filtrar eventos de hoy
        val eventosHoy = eventos.filter { it.diasRestantes == 0 }
        if (eventosHoy.isNotEmpty()) {
            val nombres = eventosHoy.joinToString(", ") { it.trabajadorNombre }
            val titulo = if (eventosHoy.size == 1) "¡Relevo Hoy en Taller Mina!" else "¡${eventosHoy.size} Relevos Hoy en Mina!"
            val mensaje = "${eventosHoy.first().descripcion} ($nombres)"
            sendShiftNotification(context, 1001, titulo, mensaje)
        }

        // 2. Filtrar colaboradores que salen mañana
        val eventosManana = eventos.filter { it.diasRestantes == 1 && it.tipo == "INICIO_DESCANSO" }
        if (eventosManana.isNotEmpty()) {
            val nombres = eventosManana.joinToString(", ") { it.trabajadorNombre }
            val titulo = "Próxima Salida de Mina (Mañana)"
            val mensaje = "Salen a descanso libre: $nombres"
            sendShiftNotification(context, 1002, titulo, mensaje)
        }
    }
}
