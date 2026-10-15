package com.mars.asistenciamina.ui.screens.trabajadores

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mars.asistenciamina.data.api.ApiClient
import com.mars.asistenciamina.data.models.TrabajadorDto
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed interface TrabajadoresUiState {
    data object Loading : TrabajadoresUiState
    data class Success(val trabajadores: List<TrabajadorDto>) : TrabajadoresUiState
    data class Error(val message: String) : TrabajadoresUiState
}

class TrabajadoresViewModel : ViewModel() {

    private val _uiState = MutableStateFlow<TrabajadoresUiState>(TrabajadoresUiState.Loading)
    val uiState: StateFlow<TrabajadoresUiState> = _uiState.asStateFlow()

    init {
        cargarColaboradores()
    }

    fun cargarColaboradores() {
        viewModelScope.launch {
            _uiState.value = TrabajadoresUiState.Loading
            try {
                val response = ApiClient.apiService.getTrabajadores(incluirInactivos = false)
                _uiState.value = TrabajadoresUiState.Success(response.data)
            } catch (e: Exception) {
                _uiState.value = TrabajadoresUiState.Error(
                    e.localizedMessage ?: "Error al obtener colaboradores"
                )
            }
        }
    }
}
