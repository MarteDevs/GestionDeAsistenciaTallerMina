package com.mars.asistenciamina.ui.screens.login

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mars.asistenciamina.data.api.ApiClient
import com.mars.asistenciamina.data.local.SessionManager
import com.mars.asistenciamina.data.models.LoginRequest
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class LoginUiState(
    val identificador: String = "",
    val password: String = "",
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val isSuccess: Boolean = false
)

class LoginViewModel : ViewModel() {

    private val _uiState = MutableStateFlow(LoginUiState())
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()

    fun onIdentificadorChange(nuevo: String) {
        _uiState.update { it.copy(identificador = nuevo, errorMessage = null) }
    }

    fun onPasswordChange(nuevo: String) {
        _uiState.update { it.copy(password = nuevo, errorMessage = null) }
    }

    fun login() {
        val ident = _uiState.value.identificador.trim()
        val pass = _uiState.value.password.trim()

        if (ident.isBlank() || pass.isBlank()) {
            _uiState.update { it.copy(errorMessage = "Por favor ingresa tu usuario o correo y contraseña.") }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            try {
                val res = ApiClient.apiService.login(LoginRequest(identificador = ident, password = pass))
                if (res.success && res.data != null) {
                    // Guardar sesión persistente
                    SessionManager.saveSession(res.data.token, res.data.usuario)
                    _uiState.update { it.copy(isLoading = false, isSuccess = true) }
                } else {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            errorMessage = res.error ?: "Credenciales inválidas."
                        )
                    }
                }
            } catch (e: Exception) {
                val mensaje = e.localizedMessage ?: "Error de conexión con el servidor de Mina."
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        errorMessage = if (mensaje.contains("401")) "Usuario o contraseña incorrectos."
                        else if (mensaje.contains("403")) "Tu cuenta está pendiente de aprobación por el Administrador."
                        else "No se pudo conectar con https://asistenciamina.duckdns.org"
                    )
                }
            }
        }
    }
}
