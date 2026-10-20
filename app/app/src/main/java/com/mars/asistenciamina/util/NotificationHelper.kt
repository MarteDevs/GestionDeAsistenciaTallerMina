package com.mars.asistenciamina.util

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.mars.asistenciamina.MainActivity
import com.mars.asistenciamina.data.local.SessionManager
import com.mars.asistenciamina.data.models.EventoNotificacionDto

object NotificationHelper {
    const val CHANNEL_ID_REGULAR = "relevos_turnos_mina"
    const val CHANNEL_NAME_REGULAR = "Relevos Programados Mina"
    const val CHANNEL_DESC_REGULAR = "Avisos de relevos y salidas a descanso a 1 y 2 días de anticipación"

    const val CHANNEL_ID_URGENT = "relevos_urgentes_hoy"
    const val CHANNEL_NAME_URGENT = "¡Alertas de Relevo Hoy!"
    const val CHANNEL_DESC_URGENT = "Notificaciones de máxima prioridad con sonido especial para el día exacto de salida o retorno a mina"

    private val URGENT_VIBRATION_PATTERN = longArrayOf(0, 450, 180, 450, 180, 600)

    fun createNotificationChannel(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager: NotificationManager =
                context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            val soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
            val audioAttributes = AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(AudioAttributes.USAGE_NOTIFICATION_EVENT)
                .build()

            // 1. Canal Regular (anticipación 1 o 2 días)
            val channelRegular = NotificationChannel(
                CHANNEL_ID_REGULAR,
                CHANNEL_NAME_REGULAR,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = CHANNEL_DESC_REGULAR
                enableLights(true)
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 250, 150, 250)
                setSound(soundUri, audioAttributes)
            }
            notificationManager.createNotificationChannel(channelRegular)

            // 2. Canal Urgente (Día Hoy: sonido especial, vibración enérgica y máxima prioridad)
            val channelUrgent = NotificationChannel(
                CHANNEL_ID_URGENT,
                CHANNEL_NAME_URGENT,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = CHANNEL_DESC_URGENT
                enableLights(true)
                lightColor = android.graphics.Color.RED
                enableVibration(true)
                vibrationPattern = URGENT_VIBRATION_PATTERN
                setSound(soundUri, audioAttributes)
            }
            notificationManager.createNotificationChannel(channelUrgent)
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
        message: String,
        channelId: String = CHANNEL_ID_REGULAR,
        isUrgent: Boolean = false
    ) {
        if (!hasNotificationPermission(context)) return

        createNotificationChannel(context)

        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        val pendingIntent: PendingIntent = PendingIntent.getActivity(
            context,
            notificationId,
            intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)

        val builder = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(com.mars.asistenciamina.R.drawable.ic_logo_asistencia_mina)
            .setContentTitle(title)
            .setContentText(message)
            .setStyle(NotificationCompat.BigTextStyle().bigText(message))
            .setPriority(if (isUrgent) NotificationCompat.PRIORITY_MAX else NotificationCompat.PRIORITY_HIGH)
            .setSound(soundUri)
            .setVibrate(if (isUrgent) URGENT_VIBRATION_PATTERN else longArrayOf(0, 250, 150, 250))
            .setContentIntent(pendingIntent)
            .setOnlyAlertOnce(true)
            .setAutoCancel(true)

        try {
            NotificationManagerCompat.from(context).notify(notificationId, builder.build())
        } catch (e: SecurityException) {
            // Permiso no concedido por el usuario
        }
    }

    /**
     * Procesa los eventos de turnos y envía alertas personalizadas:
     * - HOY (Día 0): Notificación especial con sonido y canal urgente.
     * - 1 DÍA: Aviso de salida/retorno de mañana.
     * - 2 DÍAS: Aviso previo de cambio de guardia a 48 horas.
     */
    fun notifyUpcomingShifts(context: Context, eventos: List<EventoNotificacionDto>) {
        if (!hasNotificationPermission(context) || eventos.isEmpty()) return

        SessionManager.init(context)
        SessionManager.registrarAlertaSonada()

        // 1. EVENTOS DE HOY (Día 0 - MÁXIMA PRIORIDAD Y SONIDO ESPECIAL)
        val salidasHoy = eventos.filter { it.diasRestantes == 0 && it.tipo == "INICIO_DESCANSO" }
        if (salidasHoy.isNotEmpty()) {
            val nombres = salidasHoy.joinToString(", ") { it.trabajadorNombre }
            val titulo = if (salidasHoy.size == 1) "¡HOY CULMINA TU GUARDIA!" else "¡HOY ${salidasHoy.size} RELEVOS A DESCANSO!"
            val mensaje = "Hoy culmina la guardia de 30 días en mina e inicia el descanso de 10 días: $nombres."
            sendShiftNotification(context, 1001, titulo, mensaje, CHANNEL_ID_URGENT, isUrgent = true)
        }

        val retornosHoy = eventos.filter { it.diasRestantes == 0 && (it.tipo == "FIN_DESCANSO" || it.tipo == "EN_DESCANSO") }
        if (retornosHoy.isNotEmpty()) {
            val nombres = retornosHoy.joinToString(", ") { it.trabajadorNombre }
            val titulo = if (retornosHoy.size == 1) "¡HOY RETORNO A MINA!" else "¡HOY ${retornosHoy.size} RETORNAN A MINA!"
            val mensaje = "Hoy culmina el descanso e inician labores en Taller Mina: $nombres."
            sendShiftNotification(context, 1002, titulo, mensaje, CHANNEL_ID_URGENT, isUrgent = true)
        }

        // 2. EVENTOS DE MAÑANA (Falta 1 Día)
        val salidasManana = eventos.filter { it.diasRestantes == 1 && it.tipo == "INICIO_DESCANSO" }
        if (salidasManana.isNotEmpty()) {
            val nombres = salidasManana.joinToString(", ") { it.trabajadorNombre }
            val titulo = "Falta 1 Día: ¡Mañana sales a descanso!"
            val mensaje = "Prepara el relevo en mina. Mañana inicia el periodo de descanso: $nombres."
            sendShiftNotification(context, 1003, titulo, mensaje, CHANNEL_ID_REGULAR, isUrgent = false)
        }

        val retornosManana = eventos.filter { it.diasRestantes == 1 && (it.tipo == "FIN_DESCANSO" || it.tipo == "EN_DESCANSO") }
        if (retornosManana.isNotEmpty()) {
            val nombres = retornosManana.joinToString(", ") { it.trabajadorNombre }
            val titulo = "Falta 1 Día: Mañana retorno a mina"
            val mensaje = "Último día de descanso. Mañana suben a mina a iniciar labores: $nombres."
            sendShiftNotification(context, 1004, titulo, mensaje, CHANNEL_ID_REGULAR, isUrgent = false)
        }

        // 3. EVENTOS DE 2 DÍAS (Faltan 2 Días)
        val salidasDosDias = eventos.filter { it.diasRestantes == 2 && it.tipo == "INICIO_DESCANSO" }
        if (salidasDosDias.isNotEmpty()) {
            val nombres = salidasDosDias.joinToString(", ") { it.trabajadorNombre }
            val titulo = "Faltan 2 Días para tu descanso"
            val mensaje = "Estás a 48 horas de finalizar guardia e iniciar tus 10 días libres: $nombres."
            sendShiftNotification(context, 1005, titulo, mensaje, CHANNEL_ID_REGULAR, isUrgent = false)
        }

        val retornosDosDias = eventos.filter { it.diasRestantes == 2 && (it.tipo == "FIN_DESCANSO" || it.tipo == "EN_DESCANSO") }
        if (retornosDosDias.isNotEmpty()) {
            val nombres = retornosDosDias.joinToString(", ") { it.trabajadorNombre }
            val titulo = "Faltan 2 Días para retornar a mina"
            val mensaje = "Quedan 48 horas de descanso. En 2 días retornan a labores en Taller Mina: $nombres."
            sendShiftNotification(context, 1006, titulo, mensaje, CHANNEL_ID_REGULAR, isUrgent = false)
        }

        // 4. EVENTOS DE PERMISO O VACACIONES ESPECIALES
        val permisosHoy = eventos.filter { it.diasRestantes == 0 && it.tipo == "PERMISO_ACTIVO" }
        if (permisosHoy.isNotEmpty()) {
            val nombres = permisosHoy.joinToString(", ") { it.trabajadorNombre }
            sendShiftNotification(
                context, 1007,
                "¡Permiso / Vacaciones Hoy!",
                "Inicia periodo de permiso o descanso autorizado: $nombres.",
                CHANNEL_ID_REGULAR, isUrgent = false
            )
        }

        val permisosProximos = eventos.filter { (it.diasRestantes in 1..2) && it.tipo == "PERMISO_ACTIVO" }
        if (permisosProximos.isNotEmpty()) {
            val nombres = permisosProximos.joinToString(", ") { "${it.trabajadorNombre} (en ${it.diasRestantes}d)" }
            sendShiftNotification(
                context, 1008,
                "Próximo Permiso / Vacaciones",
                "Permiso programado en las próximas 48 horas: $nombres.",
                CHANNEL_ID_REGULAR, isUrgent = false
            )
        }
    }
}
