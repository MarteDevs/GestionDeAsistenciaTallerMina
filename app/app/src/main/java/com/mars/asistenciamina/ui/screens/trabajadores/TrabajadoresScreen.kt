package com.mars.asistenciamina.ui.screens.trabajadores

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.EventAvailable
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.mars.asistenciamina.data.models.TrabajadorDto
import com.mars.asistenciamina.ui.components.SkeletonItem
import androidx.compose.foundation.border
import androidx.compose.material.icons.filled.Bedtime
import androidx.compose.material.icons.filled.Construction
import com.mars.asistenciamina.data.models.DescansoDto
import com.mars.asistenciamina.ui.theme.Amber400
import com.mars.asistenciamina.ui.theme.Amber500
import com.mars.asistenciamina.ui.theme.Cyan500
import com.mars.asistenciamina.ui.theme.Emerald500
import com.mars.asistenciamina.ui.theme.Violet500
import com.mars.asistenciamina.ui.theme.Slate200
import com.mars.asistenciamina.ui.theme.Slate400
import com.mars.asistenciamina.ui.theme.Slate600
import com.mars.asistenciamina.ui.theme.Slate800
import com.mars.asistenciamina.ui.theme.Slate900
import com.mars.asistenciamina.ui.theme.Slate950
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TrabajadoresScreen(
    viewModel: TrabajadoresViewModel = viewModel(),
    onSelectTrabajador: (TrabajadorDto) -> Unit = {}
) {
    val state by viewModel.uiState.collectAsState()
    var searchQuery by remember { mutableStateOf("") }

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
                    containerColor = Slate950,
                    titleContentColor = Color.White
                ),
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.People,
                            contentDescription = null,
                            tint = Amber400,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "EQUIPO CARPINTERÍA",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Black
                        )
                    }
                }
            )
        },
        containerColor = Slate950
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            // Buscador Simple y Rápido
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                placeholder = { Text("Buscar colaborador...", color = Slate400, fontSize = 13.sp) },
                leadingIcon = {
                    Icon(
                        imageVector = Icons.Default.Search,
                        contentDescription = null,
                        tint = Amber400,
                        modifier = Modifier.size(18.dp)
                    )
                },
                singleLine = true,
                shape = RoundedCornerShape(16.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedContainerColor = Slate900,
                    unfocusedContainerColor = Slate900,
                    focusedBorderColor = Amber500,
                    unfocusedBorderColor = Slate800,
                    focusedTextColor = Color.White,
                    unfocusedTextColor = Color.White
                )
            )

            when (val uiState = state) {
                is TrabajadoresUiState.Loading -> {
                    repeat(6) {
                        SkeletonItem()
                    }
                }

                is TrabajadoresUiState.Error -> {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(text = uiState.message, color = Slate400, fontSize = 12.sp)
                    }
                }

                is TrabajadoresUiState.Success -> {
                    val filtered = uiState.trabajadores.filter {
                        it.nombres.contains(searchQuery, ignoreCase = true)
                    }

                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(bottom = 24.dp)
                    ) {
                        item {
                            Text(
                                text = "${filtered.size} COLABORADORES REGISTRADOS",
                                color = Slate400,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 1.sp,
                                modifier = Modifier.padding(horizontal = 20.dp, vertical = 6.dp)
                            )
                        }

                        items(filtered) { trabajador ->
                            AnimatedVisibility(
                                visible = true,
                                enter = fadeIn() + slideInVertically()
                            ) {
                                CardTrabajadorItem(
                                    trabajador = trabajador,
                                    onClick = { onSelectTrabajador(trabajador) }
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

data class EstadoOperativoTrabajador(
    val enDescanso: Boolean,
    val etiquetaEstado: String,
    val detalleFechas: String,
    val colorEstado: Color
)

fun obtenerEstadoOperativo(descansos: List<DescansoDto>): EstadoOperativoTrabajador {
    if (descansos.isEmpty()) {
        return EstadoOperativoTrabajador(
            enDescanso = false,
            etiquetaEstado = "En Guardia Mina",
            detalleFechas = "Sin descansos programados",
            colorEstado = Emerald500
        )
    }

    val hoy = LocalDate.now()
    val fmt = DateTimeFormatter.ofPattern("dd MMM")

    // 1. ¿Está actualmente en descanso hoy?
    val descansoActivo = descansos.firstOrNull { d ->
        try {
            val ini = LocalDate.parse(d.fechaInicio.take(10))
            val fin = LocalDate.parse(d.fechaFin.take(10))
            !hoy.isBefore(ini) && !hoy.isAfter(fin)
        } catch (e: Exception) {
            false
        }
    }

    if (descansoActivo != null) {
        return try {
            val fin = LocalDate.parse(descansoActivo.fechaFin.take(10))
            val diasRestantes = ChronoUnit.DAYS.between(hoy, fin).toInt()
            val reincorporacion = fin.plusDays(1)
            val diasTexto = if (diasRestantes <= 0) "¡Culmina hoy!" else "Quedan ${diasRestantes}d"

            EstadoOperativoTrabajador(
                enDescanso = true,
                etiquetaEstado = "🛌 En Descanso ($diasTexto)",
                detalleFechas = "Retorna a taller: ${reincorporacion.format(fmt)}",
                colorEstado = Violet500
            )
        } catch (e: Exception) {
            EstadoOperativoTrabajador(
                enDescanso = true,
                etiquetaEstado = "🛌 En Descanso",
                detalleFechas = "Periodo activo",
                colorEstado = Violet500
            )
        }
    }

    // 2. Si no está en descanso hoy, buscar la próxima bajada a descanso
    val proximoDescanso = descansos
        .mapNotNull { d ->
            try {
                val ini = LocalDate.parse(d.fechaInicio.take(10))
                val fin = LocalDate.parse(d.fechaFin.take(10))
                if (ini.isAfter(hoy)) Triple(d, ini, fin) else null
            } catch (e: Exception) {
                null
            }
        }
        .minByOrNull { it.second }

    if (proximoDescanso != null) {
        val (d, ini, fin) = proximoDescanso
        val diasParaBajar = ChronoUnit.DAYS.between(hoy, ini).toInt()
        val rangoStr = "${ini.format(fmt)} - ${fin.format(fmt)}"
        val textoBaja = if (diasParaBajar <= 0) "¡Baja Hoy!" else if (diasParaBajar == 1) "Baja mañana" else "Baja en ${diasParaBajar}d"

        return EstadoOperativoTrabajador(
            enDescanso = false,
            etiquetaEstado = "🔨 En Mina ($textoBaja)",
            detalleFechas = "Próx. descanso: $rangoStr",
            colorEstado = Amber400
        )
    }

    return EstadoOperativoTrabajador(
        enDescanso = false,
        etiquetaEstado = "🔨 En Guardia Mina",
        detalleFechas = "Ciclo 20x10 cumplido",
        colorEstado = Emerald500
    )
}

@Composable
fun CardTrabajadorItem(
    trabajador: TrabajadorDto,
    onClick: () -> Unit
) {
    val estado = remember(trabajador.id, trabajador.descansos) {
        obtenerEstadoOperativo(trabajador.descansos)
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 5.dp)
            .clickable { onClick() },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Slate900)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Inicial Avatar con color acorde al estado
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(estado.colorEstado.copy(alpha = 0.18f))
                    .border(1.dp, estado.colorEstado.copy(alpha = 0.35f), RoundedCornerShape(12.dp)),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = trabajador.nombres.take(1).uppercase(),
                    color = estado.colorEstado,
                    fontWeight = FontWeight.Black,
                    fontSize = 17.sp
                )
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                // Nombre y Badge de estado operativo
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = trabajador.nombres,
                        color = Color.White,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1,
                        modifier = Modifier.weight(1f, fill = false)
                    )

                    Spacer(modifier = Modifier.width(6.dp))

                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(estado.colorEstado.copy(alpha = 0.15f))
                            .border(1.dp, estado.colorEstado.copy(alpha = 0.35f), RoundedCornerShape(6.dp))
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = estado.etiquetaEstado,
                            color = estado.colorEstado,
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                Spacer(modifier = Modifier.height(3.dp))

                // Detalle operativo de fechas
                Text(
                    text = estado.detalleFechas,
                    color = Slate200,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Normal
                )

                Spacer(modifier = Modifier.height(3.dp))

                // Fila inferior: Área y total de periodos
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = trabajador.area.ifBlank { "Taller Principal" },
                        color = Slate400,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Medium
                    )

                    Text(
                        text = "•",
                        color = Slate600,
                        fontSize = 10.sp
                    )

                    Text(
                        text = "${trabajador.descansos.size} periodos 2026",
                        color = Slate400,
                        fontSize = 10.sp
                    )
                }
            }

            Spacer(modifier = Modifier.width(6.dp))
            Icon(
                imageVector = Icons.Default.ChevronRight,
                contentDescription = null,
                tint = Slate800,
                modifier = Modifier.size(18.dp)
            )
        }
    }
}
