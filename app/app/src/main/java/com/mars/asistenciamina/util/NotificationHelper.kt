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

    // Agrupa todas las alertas de una misma corrida bajo un resumen: Android ya no las
    // apila genéricamente ("AsistenciaMina • 2") sino bajo una tarjeta propia con conteo.
    private const val GROUP_KEY_RELEVOS = "com.mars.asistenciamina.GRUPO_RELEVOS"
    private const val NOTIF_ID_RESUMEN = 1000

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

    /**
     * @param lineas Nombres de los colaboradores incluidos en esta alerta. Con más de uno,
     * se listan en un `InboxStyle` expandible en vez de un solo texto corrido difícil de leer.
     */
    fun sendShiftNotification(
        context: Context,
        notificationId: Int,
        title: String,
        message: String,
        channelId: String = CHANNEL_ID_REGULAR,
        isUrgent: Boolean = false,
        lineas: List<String>? = null
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

        val estilo = if (lineas != null && lineas.size > 1) {
            NotificationCompat.InboxStyle().also { style ->
                lineas.forEach { style.addLine(it) }
            }.setSummaryText(message)
        } else {
            NotificationCompat.BigTextStyle().bigText(message)
        }

        val builder = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(com.mars.asistenciamina.R.drawable.ic_logo_asistencia_mina)
            .setContentTitle(title)
            .setContentText(message)
            .setStyle(estilo)
            .setGroup(GROUP_KEY_RELEVOS)
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

    /** Tarjeta resumen del grupo: evita que Android apile las alertas de forma genérica. */
    private fun enviarResumenGrupo(context: Context, totalAlertas: Int) {
        if (totalAlertas == 0 || !hasNotificationPermission(context)) return
        val builder = NotificationCompat.Builder(context, CHANNEL_ID_REGULAR)
            .setSmallIcon(com.mars.asistenciamina.R.drawable.ic_logo_asistencia_mina)
            .setContentTitle("Relevos de hoy")
            .setContentText(if (totalAlertas == 1) "1 alerta de turno" else "$totalAlertas alertas de turno")
            .setGroup(GROUP_KEY_RELEVOS)
            .setGroupSummary(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
        try {
            NotificationManagerCompat.from(context).notify(NOTIF_ID_RESUMEN, builder.build())
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

        var totalAlertas = 0

        // Quien ve estas alertas es un supervisor monitoreando a varios colaboradores, no el
        // propio trabajador — por eso todo va en 3ra persona y con el nombre primero, nunca "tu
        // descanso". Con 1 solo colaborador el nombre va en el título; con varios, cada quien
        // aparece en su propia línea (InboxStyle) en vez de una sola oración con comas.
        fun enviarAlerta(
            notificationId: Int,
            emoji: String,
            tituloSingular: (String) -> String,
            tituloPlural: (Int) -> String,
            mensaje: String,
            channelId: String,
            isUrgent: Boolean,
            eventosGrupo: List<EventoNotificacionDto>
        ) {
            if (eventosGrupo.isEmpty()) return
            val nombres = eventosGrupo.map { it.trabajadorNombre }
            val titulo = if (nombres.size == 1) "$emoji ${tituloSingular(nombres[0])}" else "$emoji ${tituloPlural(nombres.size)}"
            sendShiftNotification(
                context, notificationId, titulo, mensaje, channelId, isUrgent,
                lineas = if (nombres.size > 1) nombres else null
            )
            totalAlertas += eventosGrupo.size
        }

        // 1. EVENTOS DE HOY (Día 0 - MÁXIMA PRIORIDAD Y SONIDO ESPECIAL)
        enviarAlerta(
            1001, "🌙",
            { "$it baja a descanso hoy" }, { "$it bajan a descanso hoy" },
            "Culmina guardia de 30 días en mina e inicia descanso de 10 días.",
            CHANNEL_ID_URGENT, isUrgent = true,
            eventos.filter { it.diasRestantes == 0 && it.tipo == "INICIO_DESCANSO" }
        )

        // El descanso ya terminó: el colaborador está hoy en mina trabajando (tipo propio del backend,
        // no debe confundirse con "EN_DESCANSO", que todavía sigue de descanso hoy).
        enviarAlerta(
            1002, "⛏️",
            { "$it ya está en mina trabajando" }, { "$it ya están en mina trabajando" },
            "Terminó su descanso e ingresó hoy a laborar en Taller Mina.",
            CHANNEL_ID_URGENT, isUrgent = true,
            eventos.filter { it.tipo == "RETORNO_HOY" }
        )

        // 2. EVENTOS DE MAÑANA (Falta 1 Día)
        enviarAlerta(
            1003, "🌙",
            { "$it baja a descanso mañana" }, { "$it bajan a descanso mañana" },
            "Culmina guardia de 30 días mañana e inicia descanso de 10 días.",
            CHANNEL_ID_REGULAR, isUrgent = false,
            eventos.filter { it.diasRestantes == 1 && it.tipo == "INICIO_DESCANSO" }
        )

        // "EN_DESCANSO" con diasRestantes = días que faltan para el día de FIN (pizarra). El día de
        // trabajo real (INGRESA) es uno después y tiene su propia alerta aparte (id 1002).
        enviarAlerta(
            1004, "⛏️",
            { "$it termina su descanso hoy" }, { "$it terminan su descanso hoy" },
            "Último día de descanso. Mañana ingresa a trabajar a Taller Mina.",
            CHANNEL_ID_REGULAR, isUrgent = false,
            eventos.filter { it.diasRestantes == 0 && it.tipo == "EN_DESCANSO" }
        )

        // 3. EVENTOS DE 2 DÍAS (Faltan 2 Días)
        enviarAlerta(
            1005, "🌙",
            { "Faltan 2 días para el descanso de $it" }, { "Faltan 2 días para el descanso de $it colaboradores" },
            "Finaliza guardia en 48 horas e inicia descanso de 10 días.",
            CHANNEL_ID_REGULAR, isUrgent = false,
            eventos.filter { it.diasRestantes == 2 && it.tipo == "INICIO_DESCANSO" }
        )

        enviarAlerta(
            1006, "⛏️",
            { "Faltan 2 días para que regrese $it" }, { "Faltan 2 días para que regresen $it colaboradores" },
            "Termina su descanso mañana; al día siguiente ingresa a trabajar.",
            CHANNEL_ID_REGULAR, isUrgent = false,
            eventos.filter { it.diasRestantes == 1 && it.tipo == "EN_DESCANSO" }
        )

        // 4. EVENTOS DE PERMISO O VACACIONES ESPECIALES
        enviarAlerta(
            1007, "🏖️",
            { "$it tiene permiso hoy" }, { "$it tienen permiso hoy" },
            "Inicia periodo de permiso o descanso autorizado.",
            CHANNEL_ID_REGULAR, isUrgent = false,
            eventos.filter { it.diasRestantes == 0 && it.tipo == "PERMISO_ACTIVO" }
        )

        enviarAlerta(
            1008, "🏖️",
            { "Próximo permiso de $it" }, { "Próximo permiso de $it colaboradores" },
            "Permiso programado en las próximas 48 horas.",
            CHANNEL_ID_REGULAR, isUrgent = false,
            eventos.filter { (it.diasRestantes in 1..2) && it.tipo == "PERMISO_ACTIVO" }
        )

        enviarResumenGrupo(context, totalAlertas)
    }
}
