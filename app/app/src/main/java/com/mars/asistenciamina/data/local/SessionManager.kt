package com.mars.asistenciamina.data.local

import android.content.Context
import android.content.SharedPreferences
import com.mars.asistenciamina.data.models.UsuarioDto

object SessionManager {
    private const val PREF_NAME = "asistencia_mina_session"
    private const val KEY_TOKEN = "jwt_token"
    private const val KEY_USER_ID = "user_id"
    private const val KEY_USERNAME = "username"
    private const val KEY_NOMBRES = "nombres"
    private const val KEY_EMAIL = "email"
    private const val KEY_ROL = "rol"
    private const val KEY_LOGGED_IN = "is_logged_in"

    private var prefs: SharedPreferences? = null

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
}
