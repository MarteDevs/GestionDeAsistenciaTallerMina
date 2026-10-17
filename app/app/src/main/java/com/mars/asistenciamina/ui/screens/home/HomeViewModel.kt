package com.mars.asistenciamina.ui.screens.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mars.asistenciamina.data.api.ApiClient
import com.mars.asistenciamina.data.local.SessionManager
import com.mars.asistenciamina.data.models.EventoNotificacionDto
import com.mars.asistenciamina.data.models.ResumenNotificacionesDto
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

sealed interface HomeUiState {
    data object Loading : HomeUiState
    data class Success(
        val resumen: ResumenNotificacionesDto,
        val eventos: List<EventoNotificacionDto>,
        val fechaReferencia: String,
        val isOffline: Boolean = false,
        val offlineTimestamp: Long = 0L
    ) : HomeUiState
    data class Error(val message: String) : HomeUiState
}

class HomeViewModel : ViewModel() {

    private val _uiState = MutableStateFlow<HomeUiState>(HomeUiState.Loading)
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    private fun getFechaHoyIso(): String {
        val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        return sdf.format(Date())
    }

    init {
        // Carga inicial: si ya hay caché disponible, mostrarlo de inmediato para arranque instantáneo
        val cached = SessionManager.getCachedTurnosResponse()
        if (cached != null) {
            _uiState.value = HomeUiState.Success(
                resumen = cached.resumen,
                eventos = cached.eventos,
                fechaReferencia = cached.fechaReferencia,
                isOffline = false, // provisional hasta verificar red
                offlineTimestamp = SessionManager.getCacheTimestamp()
            )
        }
        cargarTurnos()
    }

    fun cargarTurnos(fecha: String? = null) {
        val fechaConsulta = fecha ?: getFechaHoyIso()
        viewModelScope.launch {
            if (_uiState.value !is HomeUiState.Success) {
                _uiState.value = HomeUiState.Loading
            }
            try {
                val response = ApiClient.apiService.getProximosTurnos(
                    fechaReferencia = fechaConsulta,
                    diasVentana = 7
                )
                // Guardar en caché local para persistencia offline
                SessionManager.cacheTurnosResponse(response)

                _uiState.value = HomeUiState.Success(
                    resumen = response.resumen,
                    eventos = response.eventos,
                    fechaReferencia = response.fechaReferencia,
                    isOffline = false,
                    offlineTimestamp = System.currentTimeMillis()
                )
            } catch (e: Exception) {
                // Si falla la conexión, verificar si tenemos datos en caché
                val cached = SessionManager.getCachedTurnosResponse()
                if (cached != null) {
                    _uiState.value = HomeUiState.Success(
                        resumen = cached.resumen,
                        eventos = cached.eventos,
                        fechaReferencia = cached.fechaReferencia,
                        isOffline = true,
                        offlineTimestamp = SessionManager.getCacheTimestamp()
                    )
                } else {
                    _uiState.value = HomeUiState.Error(
                        e.localizedMessage ?: "No se pudo conectar con el servidor (https://asistenciamina.duckdns.org)"
                    )
                }
            }
        }
    }
}
