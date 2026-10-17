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
import androidx.compose.material.icons.filled.CloudOff
import androidx.compose.material.icons.filled.EventAvailable
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Search
import androidx.compose.foundation.BorderStroke
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.TopAppBar
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
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
import com.mars.asistenciamina.ui.theme.Slate300
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
            TopAppBar(
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Slate950,
                    titleContentColor = Color.White
                ),
                title = {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.padding(vertical = 4.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(Slate900)
                                .border(1.dp, Slate800, RoundedCornerShape(10.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.People,
                                contentDescription = null,
                                tint = Amber400,
                                modifier = Modifier.size(22.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text(
                                text = "EQUIPO TALLER MINA",
                                fontSize = 17.sp,
                                fontWeight = FontWeight.Black,
                                letterSpacing = 0.6.sp,
                                color = Color.White
                            )
                            Text(
                                text = "Colaboradores y Programación 20x10",
                                fontSize = 12.sp,
                                color = Slate400,
                                fontWeight = FontWeight.Medium
                            )
                        }
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
                    .padding(start = 16.dp, end = 16.dp, top = 8.dp, bottom = 12.dp),
                placeholder = { Text("Buscar colaborador...", color = Slate400, fontSize = 14.sp) },
                leadingIcon = {
                    Icon(
                        imageVector = Icons.Default.Search,
                        contentDescription = null,
                        tint = Amber400,
                        modifier = Modifier.size(20.dp)
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
                        if (uiState.isOffline) {
                            item {
                                Card(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(horizontal = 16.dp, vertical = 6.dp),
                                    shape = RoundedCornerShape(14.dp),
                                    colors = CardDefaults.cardColors(containerColor = Amber500.copy(alpha = 0.12f)),
                                    border = BorderStroke(1.dp, Amber500.copy(alpha = 0.35f))
                                ) {
                                    Row(
                                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .size(32.dp)
                                                .clip(CircleShape)
                                                .background(Amber500.copy(alpha = 0.2f)),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Icon(
                                                imageVector = Icons.Default.CloudOff,
                                                contentDescription = null,
                                                tint = Amber400,
                                                modifier = Modifier.size(16.dp)
                                            )
                                        }
                                        Spacer(modifier = Modifier.width(10.dp))
                                        Column {
                                            Text(
                                                text = "MODO SIN CONEXIÓN",
                                                color = Amber400,
                                                fontSize = 11.5.sp,
                                                fontWeight = FontWeight.Black,
                                                letterSpacing = 0.5.sp
                                            )
                                            Text(
                                                text = "Mostrando colaboradores guardados localmente.",
                                                color = Slate300,
                                                fontSize = 11.sp
                                            )
                                        }
                                    }
                                }
                            }
                        }

                        item {
                            Text(
                                text = "${filtered.size} COLABORADORES REGISTRADOS",
                                color = Slate400,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 0.8.sp,
                                modifier = Modifier.padding(start = 20.dp, end = 20.dp, top = 8.dp, bottom = 8.dp)
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
    val colorEstado: Color,
    val icono: ImageVector
)

fun obtenerEstadoOperativo(descansos: List<DescansoDto>): EstadoOperativoTrabajador {
    if (descansos.isEmpty()) {
        return EstadoOperativoTrabajador(
            enDescanso = false,
            etiquetaEstado = "En Guardia Mina",
            detalleFechas = "Sin descansos programados",
            colorEstado = Emerald500,
            icono = Icons.Default.Construction
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
                etiquetaEstado = "En Descanso ($diasTexto)",
                detalleFechas = "Retorna a taller: ${reincorporacion.format(fmt)}",
                colorEstado = Violet500,
                icono = Icons.Default.Bedtime
            )
        } catch (e: Exception) {
            EstadoOperativoTrabajador(
                enDescanso = true,
                etiquetaEstado = "En Descanso",
                detalleFechas = "Periodo activo",
                colorEstado = Violet500,
                icono = Icons.Default.Bedtime
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
            etiquetaEstado = "En Mina ($textoBaja)",
            detalleFechas = "Próx. descanso: $rangoStr",
            colorEstado = Amber400,
            icono = Icons.Default.Construction
        )
    }

    return EstadoOperativoTrabajador(
        enDescanso = false,
        etiquetaEstado = "En Guardia Mina",
        detalleFechas = "Ciclo 20x10 cumplido",
        colorEstado = Emerald500,
        icono = Icons.Default.Construction
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
            .padding(horizontal = 16.dp, vertical = 8.dp)
            .clickable { onClick() },
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Slate900),
        border = androidx.compose.foundation.BorderStroke(1.dp, Slate800)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp)
        ) {
            // Fila 1 Superior: Badge Operativo + Cantidad de periodos
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(estado.colorEstado.copy(alpha = 0.16f))
                        .border(1.dp, estado.colorEstado.copy(alpha = 0.45f), RoundedCornerShape(8.dp))
                        .padding(horizontal = 10.dp, vertical = 5.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = estado.icono,
                            contentDescription = null,
                            tint = estado.colorEstado,
                            modifier = Modifier.size(13.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = estado.etiquetaEstado.uppercase(),
                            color = estado.colorEstado,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Black,
                            letterSpacing = 0.5.sp
                        )
                    }
                }

                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(Slate800)
                        .padding(horizontal = 9.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = "${trabajador.descansos.size} turnos 2026",
                        color = Slate400,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Fila 2: Avatar Grande (52dp) + Nombre Completo (sin recortes) + Área
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(52.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(estado.colorEstado.copy(alpha = 0.18f))
                        .border(1.dp, estado.colorEstado.copy(alpha = 0.4f), RoundedCornerShape(16.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = trabajador.nombres.take(1).uppercase(),
                        color = estado.colorEstado,
                        fontWeight = FontWeight.Black,
                        fontSize = 20.sp
                    )
                }

                Spacer(modifier = Modifier.width(14.dp))

                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = trabajador.nombres,
                        color = Color.White,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Black,
                        lineHeight = 22.sp,
                        maxLines = 2
                    )

                    Spacer(modifier = Modifier.height(2.dp))

                    Text(
                        text = trabajador.area.ifBlank { "Taller Mina" },
                        color = Slate400,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium
                    )
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Fila 3: Detalle Operativo en contenedor oscuro
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(Slate950)
                    .border(1.dp, Slate800, RoundedCornerShape(12.dp))
                    .padding(horizontal = 14.dp, vertical = 10.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(
                            imageVector = Icons.Default.EventAvailable,
                            contentDescription = null,
                            tint = Amber400,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Text(
                            text = estado.detalleFechas,
                            color = Slate200,
                            fontSize = 12.5.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }

                    Icon(
                        imageVector = Icons.Default.ChevronRight,
                        contentDescription = null,
                        tint = Slate600,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }
        }
    }
}
