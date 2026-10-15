package com.mars.asistenciamina.ui.screens.home

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.ui.res.painterResource
import com.mars.asistenciamina.R
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Assignment
import androidx.compose.material.icons.filled.Bedtime
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Construction
import androidx.compose.material.icons.filled.DirectionsRun
import androidx.compose.material.icons.filled.FlightTakeoff
import androidx.compose.material.icons.filled.NotificationsActive
import androidx.compose.material.icons.filled.Paid
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.mars.asistenciamina.data.models.EventoNotificacionDto
import com.mars.asistenciamina.ui.components.SkeletonItem
import com.mars.asistenciamina.ui.theme.Amber400
import com.mars.asistenciamina.ui.theme.Amber500
import com.mars.asistenciamina.ui.theme.Cyan500
import com.mars.asistenciamina.ui.theme.Emerald500
import com.mars.asistenciamina.ui.theme.Rose500
import com.mars.asistenciamina.ui.theme.Violet500
import com.mars.asistenciamina.ui.theme.Slate200
import com.mars.asistenciamina.ui.theme.Slate400
import com.mars.asistenciamina.ui.theme.Slate600
import com.mars.asistenciamina.ui.theme.Slate800
import com.mars.asistenciamina.ui.theme.Slate900
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import com.mars.asistenciamina.ui.theme.Slate950
import androidx.compose.material.icons.automirrored.filled.Logout
import com.mars.asistenciamina.data.local.SessionManager
import com.mars.asistenciamina.util.NotificationHelper

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    viewModel: HomeViewModel = viewModel(),
    onNavigateToTrabajadores: () -> Unit = {},
    onLogout: () -> Unit = {}
) {
    val context = LocalContext.current
    val state by viewModel.uiState.collectAsState()
    val usuarioActual = remember { SessionManager.getUser() }
    var yaNotificado by rememberSaveable { mutableStateOf(false) }

    // Si hay eventos cargados, notificar automáticamente en la barra de notificaciones una sola vez por sesión
    LaunchedEffect(state) {
        if (state is HomeUiState.Success && !yaNotificado) {
            val eventos = (state as HomeUiState.Success).eventos
            if (eventos.isNotEmpty()) {
                NotificationHelper.notifyUpcomingShifts(context, eventos)
                yaNotificado = true
            }
        }
    }

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
                    containerColor = Slate950,
                    titleContentColor = Color.White
                ),
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Image(
                            painter = painterResource(id = R.drawable.ic_logo_asistencia_mina),
                            contentDescription = "Logo Taller Mina",
                            modifier = Modifier.size(36.dp)
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text(
                                text = "TALLER MINA",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Black,
                                letterSpacing = 0.5.sp
                            )
                            Text(
                                text = if (usuarioActual != null) "Hola, ${usuarioActual.nombres.split(" ").firstOrNull() ?: usuarioActual.nombres}" else "Operación 20x10 Mina",
                                fontSize = 11.5.sp,
                                color = Slate400
                            )
                        }
                    }
                },
                actions = {
                    IconButton(onClick = {
                        if (state is HomeUiState.Success) {
                            val eventos = (state as HomeUiState.Success).eventos
                            NotificationHelper.notifyUpcomingShifts(context, eventos)
                        }
                    }) {
                        Icon(
                            imageVector = Icons.Default.NotificationsActive,
                            contentDescription = "Enviar Notificación Push",
                            tint = Amber400
                        )
                    }
                    IconButton(onClick = { viewModel.cargarTurnos(null) }) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = "Actualizar",
                            tint = Color.White
                        )
                    }
                    IconButton(onClick = onLogout) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.Logout,
                            contentDescription = "Cerrar Sesión",
                            tint = Rose500
                        )
                    }
                }
            )
        },
        containerColor = Slate950
    ) { innerPadding ->
        when (val uiState = state) {
            is HomeUiState.Loading -> {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(innerPadding)
                ) {
                    Spacer(modifier = Modifier.height(16.dp))
                    repeat(5) {
                        SkeletonItem()
                    }
                }
            }

            is HomeUiState.Error -> {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(innerPadding)
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Warning,
                        contentDescription = "Error",
                        tint = Rose500,
                        modifier = Modifier.size(48.dp)
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "Error de Conexión",
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = uiState.message,
                        color = Slate400,
                        fontSize = 12.sp,
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(20.dp))
                    Button(
                        onClick = { viewModel.cargarTurnos(null) },
                        colors = ButtonDefaults.buttonColors(containerColor = Amber500)
                    ) {
                        Text(text = "Reintentar", color = Slate950, fontWeight = FontWeight.Bold)
                    }
                }
            }

            is HomeUiState.Success -> {
                var selectedTab by rememberSaveable { mutableStateOf("TODOS") }

                val totalCount = uiState.eventos.size
                val descansoCount = uiState.eventos.count { it.tipo == "EN_DESCANSO" || it.tipo == "FIN_DESCANSO" }
                val porBajarCount = uiState.eventos.count { it.tipo == "INICIO_DESCANSO" }
                val ventasCount = uiState.eventos.count { it.tipo == "VENTA_ACTIVA" || it.tipo == "PERMISO_ACTIVO" }

                val eventosFiltrados = remember(selectedTab, uiState.eventos) {
                    when (selectedTab) {
                        "EN_DESCANSO" -> uiState.eventos.filter { it.tipo == "EN_DESCANSO" || it.tipo == "FIN_DESCANSO" }
                        "POR_BAJAR" -> uiState.eventos.filter { it.tipo == "INICIO_DESCANSO" }
                        "VENTAS" -> uiState.eventos.filter { it.tipo == "VENTA_ACTIVA" || it.tipo == "PERMISO_ACTIVO" }
                        else -> uiState.eventos
                    }
                }

                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(innerPadding),
                    contentPadding = PaddingValues(bottom = 24.dp)
                ) {
                    // Header Card con Resumen
                    item {
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp, vertical = 8.dp),
                            shape = RoundedCornerShape(20.dp),
                            colors = CardDefaults.cardColors(containerColor = Slate900)
                        ) {
                            Column(modifier = Modifier.padding(20.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column {
                                        Text(
                                            text = "Relevos en Mina",
                                            color = Color.White,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 17.sp
                                        )
                                        Spacer(modifier = Modifier.height(2.dp))
                                        Text(
                                            text = "Ref: ${uiState.fechaReferencia} (7 días ventana)",
                                            color = Slate400,
                                            fontSize = 12.sp
                                        )
                                    }

                                    Box(
                                        modifier = Modifier
                                            .clip(CircleShape)
                                            .background(Amber500.copy(alpha = 0.15f))
                                            .padding(horizontal = 12.dp, vertical = 5.dp)
                                    ) {
                                        Text(
                                            text = "${uiState.resumen.total} Alertas",
                                            color = Amber400,
                                            fontSize = 11.5.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.height(18.dp))

                                // Grid de 3 Métricas Operativas
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                                ) {
                                    MetricaBadge(
                                        titulo = "En Descanso",
                                        valor = descansoCount.toString(),
                                        color = Violet500,
                                        modifier = Modifier.weight(1f)
                                    )
                                    MetricaBadge(
                                        titulo = "Por Bajar",
                                        valor = porBajarCount.toString(),
                                        color = Amber400,
                                        modifier = Modifier.weight(1f)
                                    )
                                    MetricaBadge(
                                        titulo = "Ventas / VD",
                                        valor = ventasCount.toString(),
                                        color = Emerald500,
                                        modifier = Modifier.weight(1f)
                                    )
                                }
                            }
                        }
                    }

                    // Segmented Tabs / Filtros Rápidos
                    item {
                        LazyRow(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp, vertical = 6.dp),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            item {
                                FiltroChip(
                                    texto = "Todos",
                                    conteo = totalCount,
                                    seleccionado = selectedTab == "TODOS",
                                    colorActivo = Amber500,
                                    onClick = { selectedTab = "TODOS" }
                                )
                            }
                            item {
                                FiltroChip(
                                    texto = "En Descanso",
                                    conteo = descansoCount,
                                    seleccionado = selectedTab == "EN_DESCANSO",
                                    colorActivo = Violet500,
                                    icon = Icons.Default.Bedtime,
                                    onClick = { selectedTab = "EN_DESCANSO" }
                                )
                            }
                            item {
                                FiltroChip(
                                    texto = "Por Bajar",
                                    conteo = porBajarCount,
                                    seleccionado = selectedTab == "POR_BAJAR",
                                    colorActivo = Amber400,
                                    icon = Icons.Default.FlightTakeoff,
                                    onClick = { selectedTab = "POR_BAJAR" }
                                )
                            }
                            item {
                                FiltroChip(
                                    texto = "Ventas (VD)",
                                    conteo = ventasCount,
                                    seleccionado = selectedTab == "VENTAS",
                                    colorActivo = Emerald500,
                                    icon = Icons.Default.Paid,
                                    onClick = { selectedTab = "VENTAS" }
                                )
                            }
                        }
                    }

                    // Título de la sección
                    item {
                        Text(
                            text = when (selectedTab) {
                                "EN_DESCANSO" -> "PERSONAL EN DESCANSO PROGRAMADO (${eventosFiltrados.size})"
                                "POR_BAJAR" -> "PRÓXIMAS SALIDAS A DESCANSO (${eventosFiltrados.size})"
                                "VENTAS" -> "VENTAS DE DESCANSO ACTIVAS (${eventosFiltrados.size})"
                                else -> "TODOS LOS RELEVOS EN VENTANA (${eventosFiltrados.size})"
                            },
                            color = Slate400,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 0.8.sp,
                            modifier = Modifier.padding(start = 20.dp, end = 20.dp, top = 14.dp, bottom = 8.dp)
                        )
                    }

                    if (eventosFiltrados.isEmpty()) {
                        item {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 16.dp, vertical = 30.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Icon(
                                        imageVector = Icons.Default.DirectionsRun,
                                        contentDescription = null,
                                        tint = Slate600,
                                        modifier = Modifier.size(36.dp)
                                    )
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text(
                                        text = "No hay registros en esta categoría",
                                        color = Slate400,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Medium
                                    )
                                }
                            }
                        }
                    } else {
                        // Lista de Eventos Filtrados
                        items(eventosFiltrados, key = { it.id }) { evento ->
                            AnimatedVisibility(
                                visible = true,
                                enter = fadeIn() + slideInVertically()
                            ) {
                                EventoItemCard(evento = evento)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun FiltroChip(
    texto: String,
    conteo: Int,
    seleccionado: Boolean,
    colorActivo: Color,
    icon: ImageVector? = null,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(12.dp))
            .background(if (seleccionado) colorActivo.copy(alpha = 0.2f) else Slate900)
            .border(
                width = 1.dp,
                color = if (seleccionado) colorActivo else Slate800,
                shape = RoundedCornerShape(12.dp)
            )
            .clickable { onClick() }
            .padding(horizontal = 14.dp, vertical = 9.dp),
        contentAlignment = Alignment.Center
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            if (icon != null) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = if (seleccionado) colorActivo else Slate400,
                    modifier = Modifier.size(15.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
            }
            Text(
                text = texto,
                color = if (seleccionado) colorActivo else Slate400,
                fontSize = 13.sp,
                fontWeight = if (seleccionado) FontWeight.Bold else FontWeight.Medium
            )
            Spacer(modifier = Modifier.width(7.dp))
            Box(
                modifier = Modifier
                    .clip(CircleShape)
                    .background(if (seleccionado) colorActivo else Slate800)
                    .padding(horizontal = 7.dp, vertical = 2.dp)
            ) {
                Text(
                    text = conteo.toString(),
                    color = if (seleccionado) Slate950 else Slate400,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Black
                )
            }
        }
    }
}

@Composable
fun MetricaBadge(
    titulo: String,
    valor: String,
    color: Color,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(14.dp))
            .background(Slate950)
            .padding(vertical = 12.dp, horizontal = 10.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(text = valor, color = color, fontSize = 18.sp, fontWeight = FontWeight.Black)
            Spacer(modifier = Modifier.height(4.dp))
            Text(text = titulo, color = Slate400, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
        }
    }
}

@Composable
fun EventoItemCard(evento: EventoNotificacionDto) {
    val esEnDescanso = evento.tipo == "EN_DESCANSO" || evento.tipo == "FIN_DESCANSO"
    val esPorBajar = evento.tipo == "INICIO_DESCANSO"
    val esVenta = evento.tipo == "VENTA_ACTIVA"

    val badgeColor = when {
        esEnDescanso -> Violet500
        esPorBajar -> Amber400
        esVenta -> Emerald500
        else -> Rose500
    }

    val badgeLabel = when {
        esEnDescanso -> "En Descanso"
        esPorBajar -> "Por Bajar"
        esVenta -> "Venta Activa"
        else -> "Permiso"
    }

    val iconVector = when {
        esEnDescanso -> Icons.Default.Bedtime
        esPorBajar -> Icons.Default.FlightTakeoff
        esVenta -> Icons.Default.Paid
        else -> Icons.Default.Assignment
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 7.dp),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = Slate900)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(46.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .background(badgeColor.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = iconVector,
                    contentDescription = null,
                    tint = badgeColor,
                    modifier = Modifier.size(24.dp)
                )
            }

            Spacer(modifier = Modifier.width(14.dp))

            Column(modifier = Modifier.weight(1f)) {
                // Fila 1: Nombre y Badge de Estado
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = evento.trabajadorNombre,
                        color = Color.White,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.weight(1f, fill = false)
                    )

                    Spacer(modifier = Modifier.width(8.dp))

                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(7.dp))
                            .background(badgeColor.copy(alpha = 0.18f))
                            .border(1.dp, badgeColor.copy(alpha = 0.4f), RoundedCornerShape(7.dp))
                            .padding(horizontal = 8.dp, vertical = 3.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = iconVector,
                                contentDescription = null,
                                tint = badgeColor,
                                modifier = Modifier.size(11.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = badgeLabel,
                                color = badgeColor,
                                fontSize = 10.5.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(5.dp))

                // Fila 2: Descripción amigable y clara
                Text(
                    text = evento.descripcion,
                    color = Slate200,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Normal,
                    lineHeight = 17.sp
                )

                Spacer(modifier = Modifier.height(7.dp))

                // Fila 3: Fecha clave y Contador de días
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.CalendarMonth,
                            contentDescription = null,
                            tint = Slate400,
                            modifier = Modifier.size(13.dp)
                        )
                        Spacer(modifier = Modifier.width(5.dp))
                        Text(
                            text = when {
                                esEnDescanso -> "Fin de descanso: ${evento.fecha}"
                                esPorBajar -> "Inicia descanso: ${evento.fecha}"
                                esVenta -> "Labora hasta: ${evento.fecha}"
                                else -> evento.fecha
                            },
                            color = Slate400,
                            fontSize = 11.5.sp
                        )
                    }

                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(7.dp))
                            .background(
                                if (evento.esHoy) Rose500.copy(alpha = 0.2f)
                                else Slate800
                            )
                            .padding(horizontal = 8.dp, vertical = 3.dp)
                    ) {
                        Text(
                            text = when {
                                evento.esHoy -> "¡HOY!"
                                esEnDescanso -> "Quedan ${evento.diasRestantes}d"
                                esPorBajar -> "Baja en ${evento.diasRestantes}d"
                                else -> "en ${evento.diasRestantes}d"
                            },
                            color = if (evento.esHoy) Rose500 else Slate400,
                            fontSize = 10.5.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.width(8.dp))
            Icon(
                imageVector = Icons.Default.ChevronRight,
                contentDescription = null,
                tint = Slate600,
                modifier = Modifier.size(18.dp)
            )
        }
    }
}
