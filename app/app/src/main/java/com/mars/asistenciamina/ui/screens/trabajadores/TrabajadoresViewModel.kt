package com.mars.asistenciamina.ui.screens.trabajadores

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mars.asistenciamina.data.api.ApiClient
import com.mars.asistenciamina.data.local.SessionManager
import com.mars.asistenciamina.data.models.TrabajadorDto
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed interface TrabajadoresUiState {
    data object Loading : TrabajadoresUiState
    data class Success(
        val trabajadores: List<TrabajadorDto>,
        val isOffline: Boolean = false,
        val offlineTimestamp: Long = 0L
    ) : TrabajadoresUiState
    data class Error(val message: String) : TrabajadoresUiState
}

class TrabajadoresViewModel : ViewModel() {

    private val _uiState = MutableStateFlow<TrabajadoresUiState>(TrabajadoresUiState.Loading)
    val uiState: StateFlow<TrabajadoresUiState> = _uiState.asStateFlow()

    init {
        // Carga inicial instantánea desde caché si existe
        val cached = SessionManager.getCachedTrabajadoresResponse()
        if (!cached.isNullOrEmpty()) {
            _uiState.value = TrabajadoresUiState.Success(
                trabajadores = cached,
                isOffline = false,
                offlineTimestamp = SessionManager.getCacheTimestamp()
            )
        }
        cargarColaboradores()
    }

    fun cargarColaboradores() {
        viewModelScope.launch {
            if (_uiState.value !is TrabajadoresUiState.Success) {
                _uiState.value = TrabajadoresUiState.Loading
            }
            try {
                val response = ApiClient.apiService.getTrabajadores(incluirInactivos = false)
                SessionManager.cacheTrabajadoresResponse(response.data)

                _uiState.value = TrabajadoresUiState.Success(
                    trabajadores = response.data,
                    isOffline = false,
                    offlineTimestamp = System.currentTimeMillis()
                )
            } catch (e: Exception) {
                val cached = SessionManager.getCachedTrabajadoresResponse()
                if (!cached.isNullOrEmpty()) {
                    _uiState.value = TrabajadoresUiState.Success(
                        trabajadores = cached,
                        isOffline = true,
                        offlineTimestamp = SessionManager.getCacheTimestamp()
                    )
                } else {
                    _uiState.value = TrabajadoresUiState.Error(
                        e.localizedMessage ?: "Error al obtener colaboradores"
                    )
                }
            }
        }
    }
}
