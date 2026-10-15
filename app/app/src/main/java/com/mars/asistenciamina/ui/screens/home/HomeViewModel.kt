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
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

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

    private fun getFechaHoyIso(): String {
        val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        return sdf.format(Date())
    }

    init {
        // Carga inicial con la fecha actual
        cargarTurnos()
    }

    fun cargarTurnos(fecha: String? = null) {
        val fechaConsulta = fecha ?: getFechaHoyIso()
        viewModelScope.launch {
            _uiState.value = HomeUiState.Loading
            try {
                val response = ApiClient.apiService.getProximosTurnos(
                    fechaReferencia = fechaConsulta,
                    diasVentana = 7
                )
                _uiState.value = HomeUiState.Success(
                    resumen = response.resumen,
                    eventos = response.eventos,
                    fechaReferencia = response.fechaReferencia
                )
            } catch (e: Exception) {
                _uiState.value = HomeUiState.Error(
                    e.localizedMessage ?: "No se pudo conectar con el servidor (https://asistenciamina.duckdns.org)"
                )
            }
        }
    }
}
