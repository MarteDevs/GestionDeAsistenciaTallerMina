package com.mars.asistenciamina.ui.screens.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mars.asistenciamina.data.api.ApiClient
import com.mars.asistenciamina.data.models.EventoNotificacionDto
import com.mars.asistenciamina.data.models.ResumenNotificacionesDto
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed interface HomeUiState {
    data object Loading : HomeUiState
    data class Success(
        val resumen: ResumenNotificacionesDto,
        val eventos: List<EventoNotificacionDto>,
        val fechaReferencia: String
    ) : HomeUiState
    data class Error(val message: String) : HomeUiState
}

class HomeViewModel : ViewModel() {

    private val _uiState = MutableStateFlow<HomeUiState>(HomeUiState.Loading)
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    init {
        cargarTurnos("2026-10-13")
    }

    fun cargarTurnos(fecha: String = "2026-10-13") {
        viewModelScope.launch {
            _uiState.value = HomeUiState.Loading
            try {
                val response = ApiClient.apiService.getProximosTurnos(
                    fechaReferencia = fecha,
                    diasVentana = 7
                )
                _uiState.value = HomeUiState.Success(
                    resumen = response.resumen,
                    eventos = response.eventos,
                    fechaReferencia = response.fechaReferencia
                )
            } catch (e: Exception) {
                _uiState.value = HomeUiState.Error(
                    e.localizedMessage ?: "No se pudo conectar con el servidor local (10.0.2.2:4000)"
                )
            }
        }
    }
}
