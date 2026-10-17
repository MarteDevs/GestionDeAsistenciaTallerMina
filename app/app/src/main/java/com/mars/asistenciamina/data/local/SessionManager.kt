package com.mars.asistenciamina.data.local

import android.content.Context
import android.content.SharedPreferences
import com.mars.asistenciamina.data.models.ProximosTurnosResponse
import com.mars.asistenciamina.data.models.TrabajadorDto
import com.mars.asistenciamina.data.models.UsuarioDto
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

object SessionManager {
    private const val PREF_NAME = "asistencia_mina_session"
    private const val KEY_TOKEN = "jwt_token"
    private const val KEY_USER_ID = "user_id"
    private const val KEY_USERNAME = "username"
    private const val KEY_NOMBRES = "nombres"
    private const val KEY_EMAIL = "email"
    private const val KEY_ROL = "rol"
    private const val KEY_LOGGED_IN = "is_logged_in"

    // Offline Cache Keys
    private const val KEY_CACHE_TURNOS = "cache_proximos_turnos"
    private const val KEY_CACHE_TRABAJADORES = "cache_trabajadores"
    private const val KEY_CACHE_TIMESTAMP = "cache_timestamp"

    private var prefs: SharedPreferences? = null

    private val json = Json {
        ignoreUnknownKeys = true
        coerceInputValues = true
        encodeDefaults = true
    }

    fun init(context: Context) {
        if (prefs == null) {
            prefs = context.applicationContext.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
        }
    }

    fun saveSession(token: String, usuario: UsuarioDto) {
        prefs?.edit()?.apply {
            putString(KEY_TOKEN, token)
            putInt(KEY_USER_ID, usuario.id)
            putString(KEY_USERNAME, usuario.username ?: "")
            putString(KEY_NOMBRES, usuario.nombres)
            putString(KEY_EMAIL, usuario.email)
            putString(KEY_ROL, usuario.rol)
            putBoolean(KEY_LOGGED_IN, true)
            apply()
        }
    }

    fun getToken(): String? {
        return prefs?.getString(KEY_TOKEN, null)
    }

    fun isLoggedIn(): Boolean {
        return prefs?.getBoolean(KEY_LOGGED_IN, false) == true && !getToken().isNullOrBlank()
    }

    fun getUser(): UsuarioDto? {
        val id = prefs?.getInt(KEY_USER_ID, -1) ?: -1
        if (id == -1) return null
        return UsuarioDto(
            id = id,
            email = prefs?.getString(KEY_EMAIL, "") ?: "",
            username = prefs?.getString(KEY_USERNAME, null)?.ifEmpty { null },
            nombres = prefs?.getString(KEY_NOMBRES, "") ?: "",
            rol = prefs?.getString(KEY_ROL, "TRABAJADOR") ?: "TRABAJADOR"
        )
    }

    fun clearSession() {
        prefs?.edit()?.clear()?.apply()
    }

    // --- MÉTODOS DE CACHÉ OFFLINE ---

    fun cacheTurnosResponse(response: ProximosTurnosResponse) {
        try {
            val jsonStr = json.encodeToString(response)
            prefs?.edit()?.apply {
                putString(KEY_CACHE_TURNOS, jsonStr)
                putLong(KEY_CACHE_TIMESTAMP, System.currentTimeMillis())
                apply()
            }
        } catch (e: Exception) {
            // Error serializando caché
        }
    }

    fun getCachedTurnosResponse(): ProximosTurnosResponse? {
        val jsonStr = prefs?.getString(KEY_CACHE_TURNOS, null) ?: return null
        return try {
            json.decodeFromString<ProximosTurnosResponse>(jsonStr)
        } catch (e: Exception) {
            null
        }
    }

    fun cacheTrabajadoresResponse(trabajadores: List<TrabajadorDto>) {
        try {
            val jsonStr = json.encodeToString(trabajadores)
            prefs?.edit()?.apply {
                putString(KEY_CACHE_TRABAJADORES, jsonStr)
                putLong(KEY_CACHE_TIMESTAMP, System.currentTimeMillis())
                apply()
            }
        } catch (e: Exception) {
            // Error serializando caché
        }
    }

    fun getCachedTrabajadoresResponse(): List<TrabajadorDto>? {
        val jsonStr = prefs?.getString(KEY_CACHE_TRABAJADORES, null) ?: return null
        return try {
            json.decodeFromString<List<TrabajadorDto>>(jsonStr)
        } catch (e: Exception) {
            null
        }
    }

    fun getCacheTimestamp(): Long {
        return prefs?.getLong(KEY_CACHE_TIMESTAMP, 0L) ?: 0L
    }
}
