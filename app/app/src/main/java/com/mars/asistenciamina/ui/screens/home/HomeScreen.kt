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
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBarDefaults
import java.time.LocalDate
import java.util.Locale
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
import com.mars.asistenciamina.ui.theme.Slate300
import com.mars.asistenciamina.ui.theme.Slate400
import com.mars.asistenciamina.ui.theme.Slate600
import com.mars.asistenciamina.ui.theme.Slate700
import com.mars.asistenciamina.ui.theme.Slate800
import com.mars.asistenciamina.ui.theme.Slate900
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import com.mars.asistenciamina.ui.theme.Slate950
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.CloudOff
import androidx.compose.material.icons.filled.Dns
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.VolumeUp
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.foundation.BorderStroke
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
    var showConfigModal by rememberSaveable { mutableStateOf(false) }

    // Auto-recarga automática al iniciar o cuando entra en foco la pantalla
    LaunchedEffect(Unit) {
        viewModel.cargarTurnos(null)
    }

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
                            Image(
                                painter = painterResource(id = R.drawable.ic_logo_asistencia_mina),
                                contentDescription = "Logo Taller Mina",
                                modifier = Modifier.size(30.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text(
                                text = "TALLER MINA",
                                fontSize = 17.sp,
                                fontWeight = FontWeight.Black,
                                letterSpacing = 0.6.sp,
                                color = Color.White
                            )
                            Text(
                                text = if (usuarioActual != null) "Hola, ${usuarioActual.nombres.split(" ").firstOrNull() ?: usuarioActual.nombres}" else "Operación 20x10 Mina",
                                fontSize = 12.sp,
                                color = Slate400,
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }
                },
                actions = {
                    // Botón de notificaciones push de relevos
                    IconButton(
                        onClick = {
                            if (state is HomeUiState.Success) {
                                val eventos = (state as HomeUiState.Success).eventos
                                NotificationHelper.notifyUpcomingShifts(context, eventos)
                            }
                        },
                        modifier = Modifier.size(44.dp)
                    ) {
                        Box(contentAlignment = Alignment.TopEnd) {
                            Icon(
                                imageVector = Icons.Default.NotificationsActive,
                                contentDescription = "Enviar Notificación Push",
                                tint = Amber400,
                                modifier = Modifier.size(24.dp)
                            )
                            val totalAlertas = (state as? HomeUiState.Success)?.resumen?.total ?: 0
                            if (totalAlertas > 0) {
                                Box(
                                    modifier = Modifier
                                        .size(16.dp)
                                        .clip(CircleShape)
                                        .background(Rose500),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = if (totalAlertas > 9) "9+" else totalAlertas.toString(),
                                        color = Color.White,
                                        fontSize = 9.sp,
                                        fontWeight = FontWeight.Black
                                    )
                                }
                            }
                        }
                    }

                    // Tuerca de Configuración (reemplaza recarga y salir directos)
                    IconButton(
                        onClick = { showConfigModal = true },
                        modifier = Modifier.size(44.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Settings,
                            contentDescription = "Configuraciones",
                            tint = Slate200,
                            modifier = Modifier.size(23.dp)
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
                    // Banner de Modo Sin Conexión
                    if (uiState.isOffline) {
                        item {
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 16.dp, vertical = 6.dp),
                                shape = RoundedCornerShape(16.dp),
                                colors = CardDefaults.cardColors(containerColor = Amber500.copy(alpha = 0.12f)),
                                border = BorderStroke(1.dp, Amber500.copy(alpha = 0.35f))
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(34.dp)
                                            .clip(CircleShape)
                                            .background(Amber500.copy(alpha = 0.2f)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.CloudOff,
                                            contentDescription = null,
                                            tint = Amber400,
                                            modifier = Modifier.size(18.dp)
                                        )
                                    }
                                    Spacer(modifier = Modifier.width(12.dp))
                                    Column {
                                        Text(
                                            text = "MODO SIN CONEXIÓN ACTIVO",
                                            color = Amber400,
                                            fontSize = 11.5.sp,
                                            fontWeight = FontWeight.Black,
                                            letterSpacing = 0.5.sp
                                        )
                                        Text(
                                            text = "Mostrando datos guardados localmente. Puedes seguir consultando relevos y turnos.",
                                            color = Slate300,
                                            fontSize = 11.sp,
                                            lineHeight = 15.sp
                                        )
                                    }
                                }
                            }
                        }
                    }

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

    // Modal Bottom Sheet de Configuración
    if (showConfigModal) {
        val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
        ModalBottomSheet(
            onDismissRequest = { showConfigModal = false },
            sheetState = sheetState,
            containerColor = Slate900,
            contentColor = Color.White,
            dragHandle = {
                Box(
                    modifier = Modifier
                        .padding(vertical = 12.dp)
                        .size(width = 44.dp, height = 4.dp)
                        .clip(RoundedCornerShape(2.dp))
                        .background(Slate700)
                )
            }
        ) {
            ConfiguracionSheetContent(
                usuario = usuarioActual,
                isOffline = (state as? HomeUiState.Success)?.isOffline == true,
                onLogout = {
                    showConfigModal = false
                    onLogout()
                },
                onClose = { showConfigModal = false }
            )
        }
    }
}

@Composable
fun ConfiguracionSheetContent(
    usuario: com.mars.asistenciamina.data.models.UsuarioDto?,
    isOffline: Boolean,
    onLogout: () -> Unit,
    onClose: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 12.dp)
            .padding(bottom = 28.dp)
    ) {
        // Título del Sheet
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(Slate800)
                        .border(1.dp, Slate700, RoundedCornerShape(10.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Settings,
                        contentDescription = null,
                        tint = Amber400,
                        modifier = Modifier.size(20.dp)
                    )
                }
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Text(
                        text = "Configuración",
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    Text(
                        text = "Ajustes de cuenta y sistema",
                        fontSize = 11.5.sp,
                        color = Slate400
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(18.dp))

        // Ficha de Usuario Logueado
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Slate950),
            border = BorderStroke(1.dp, Slate800)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .clip(CircleShape)
                        .background(Amber500.copy(alpha = 0.2f))
                        .border(1.5.dp, Amber500.copy(alpha = 0.6f), CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    val inicial = usuario?.nombres?.firstOrNull()?.uppercaseChar()?.toString() ?: "U"
                    Text(
                        text = inicial,
                        color = Amber400,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Black
                    )
                }
                Spacer(modifier = Modifier.width(14.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = usuario?.nombres ?: "Usuario del Sistema",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = usuario?.email?.ifBlank { "@${usuario.username}" } ?: "asistencia@tallermina.com",
                        fontSize = 12.sp,
                        color = Slate400,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(if (usuario?.rol == "ADMIN") Amber500.copy(alpha = 0.2f) else Slate800)
                        .border(1.dp, if (usuario?.rol == "ADMIN") Amber500.copy(alpha = 0.5f) else Slate700, RoundedCornerShape(8.dp))
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = usuario?.rol ?: "TRABAJADOR",
                        fontSize = 10.5.sp,
                        fontWeight = FontWeight.Black,
                        color = if (usuario?.rol == "ADMIN") Amber400 else Slate300
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        // Bloque de Estado del Servidor y Régimen
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Slate950),
            border = BorderStroke(1.dp, Slate800)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                // Servidor
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Dns,
                            contentDescription = null,
                            tint = Slate400,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text(
                                text = "Servidor VPS",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = Color.White
                            )
                            Text(
                                text = "asistenciamina.duckdns.org",
                                fontSize = 11.5.sp,
                                color = Slate400
                            )
                        }
                    }

                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(if (isOffline) Amber500.copy(alpha = 0.15f) else Emerald500.copy(alpha = 0.15f))
                            .border(1.dp, if (isOffline) Amber500.copy(alpha = 0.5f) else Emerald500.copy(alpha = 0.5f), RoundedCornerShape(8.dp))
                            .padding(horizontal = 8.dp, vertical = 3.dp)
                    ) {
                        Text(
                            text = if (isOffline) "MODO LOCAL" else "EN LÍNEA",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Black,
                            color = if (isOffline) Amber400 else Emerald500
                        )
                    }
                }

                HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp), color = Slate800)

                // Notificaciones y Sonidos
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.VolumeUp,
                        contentDescription = null,
                        tint = Amber400,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(10.dp))
                    Column {
                        Text(
                            text = "Alertas de Relevo Activas",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Color.White
                        )
                        Text(
                            text = "Avisos a 2 días, 1 día y alarma especial Día Hoy",
                            fontSize = 11.5.sp,
                            color = Slate400
                        )
                    }
                }

                HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp), color = Slate800)

                // Info de App
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.Info,
                        contentDescription = null,
                        tint = Slate400,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(10.dp))
                    Column {
                        Text(
                            text = "Régimen Atípico 20x10",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Color.White
                        )
                        Text(
                            text = "Versión Móvil 1.0.0 (Taller Mina 2026)",
                            fontSize = 11.5.sp,
                            color = Slate400
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Botón de Cerrar Sesión
        Button(
            onClick = onLogout,
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp),
            shape = RoundedCornerShape(14.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = Rose500.copy(alpha = 0.15f),
                contentColor = Rose500
            ),
            border = BorderStroke(1.dp, Rose500.copy(alpha = 0.4f))
        ) {
            Icon(
                imageVector = Icons.AutoMirrored.Filled.Logout,
                contentDescription = null,
                tint = Rose500,
                modifier = Modifier.size(18.dp)
            )
            Spacer(modifier = Modifier.width(10.dp))
            Text(
                text = "Cerrar Sesión",
                fontSize = 14.5.sp,
                fontWeight = FontWeight.Bold,
                color = Rose500
            )
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

fun limpiarDescripcion(descripcion: String, trabajadorNombre: String): String {
    var limpia = descripcion
        .replace(Regex("""\s*\(\d{4}-\d{2}-\d{2}\)"""), "")
        .replace(Regex("""\s*\(\d{2}/\d{2}/\d{4}\)"""), "")
        .trim()

    if (trabajadorNombre.isNotBlank() && limpia.startsWith(trabajadorNombre, ignoreCase = true)) {
        limpia = limpia.substring(trabajadorNombre.length).trimStart()
        if (limpia.startsWith("se encuentra", ignoreCase = true)) {
            limpia = "Se encuentra" + limpia.substring(12)
        } else if (limpia.startsWith("culmina", ignoreCase = true)) {
            limpia = "Culmina" + limpia.substring(7)
        } else if (limpia.startsWith("está", ignoreCase = true)) {
            limpia = "Está" + limpia.substring(4)
        } else if (limpia.startsWith("tiene", ignoreCase = true)) {
            limpia = "Tiene" + limpia.substring(5)
        } else if (limpia.isNotEmpty()) {
            limpia = limpia.replaceFirstChar { it.uppercase() }
        }
    }
    return limpia
}

fun formatearFechaEspanol(fechaIso: String): String {
    return try {
        val iso = fechaIso.take(10)
        val d = LocalDate.parse(iso)
        val diaSem = d.dayOfWeek.getDisplayName(java.time.format.TextStyle.FULL, Locale("es", "PE"))
            .replaceFirstChar { it.uppercase() }
        val mes = d.month.getDisplayName(java.time.format.TextStyle.FULL, Locale("es", "PE"))
            .replaceFirstChar { it.uppercase() }
        "$diaSem, ${d.dayOfMonth} de $mes de ${d.year}"
    } catch (e: Exception) {
        fechaIso
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
        else -> "Permiso Especial"
    }

    val iconVector = when {
        esEnDescanso -> Icons.Default.Bedtime
        esPorBajar -> Icons.Default.FlightTakeoff
        esVenta -> Icons.Default.Paid
        else -> Icons.Default.Assignment
    }

    val fechaLegible = remember(evento.fecha) {
        formatearFechaEspanol(evento.fecha)
    }

    val descLimpia = remember(evento.descripcion, evento.trabajadorNombre) {
        limpiarDescripcion(evento.descripcion, evento.trabajadorNombre)
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Slate900),
        border = androidx.compose.foundation.BorderStroke(1.dp, Slate800)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp)
        ) {
            // Fila Superior 1: Badges de Estado y Contador de Días en extremos limpios
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Badge de Estado Operativo
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(badgeColor.copy(alpha = 0.16f))
                        .border(1.dp, badgeColor.copy(alpha = 0.45f), RoundedCornerShape(8.dp))
                        .padding(horizontal = 10.dp, vertical = 5.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = iconVector,
                            contentDescription = null,
                            tint = badgeColor,
                            modifier = Modifier.size(13.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = badgeLabel.uppercase(),
                            color = badgeColor,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Black,
                            letterSpacing = 0.5.sp
                        )
                    }
                }

                // Badge Contador de Días
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(
                            if (evento.esHoy) Rose500.copy(alpha = 0.2f)
                            else Slate800
                        )
                        .border(
                            1.dp,
                            if (evento.esHoy) Rose500.copy(alpha = 0.6f) else Slate700,
                            RoundedCornerShape(8.dp)
                        )
                        .padding(horizontal = 10.dp, vertical = 5.dp)
                ) {
                    Text(
                        text = when {
                            evento.esHoy -> "¡HOY!"
                            esEnDescanso -> "Quedan ${evento.diasRestantes} días"
                            esPorBajar -> "Baja en ${evento.diasRestantes} ${if (evento.diasRestantes == 1) "día" else "días"}"
                            else -> "En ${evento.diasRestantes} días"
                        },
                        color = if (evento.esHoy) Rose500 else Slate300,
                        fontSize = 11.5.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Fila 2: Avatar Grande (52dp) + Nombre Completo (sin recortes) + Área + Descripción
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.Top
            ) {
                Box(
                    modifier = Modifier
                        .size(52.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(badgeColor.copy(alpha = 0.15f))
                        .border(1.dp, badgeColor.copy(alpha = 0.35f), RoundedCornerShape(16.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = iconVector,
                        contentDescription = null,
                        tint = badgeColor,
                        modifier = Modifier.size(28.dp)
                    )
                }

                Spacer(modifier = Modifier.width(14.dp))

                Column(modifier = Modifier.weight(1f)) {
                    // Nombre Completo: Fuente grande, FontWeight.Black, hasta 2 líneas para NUNCA truncar
                    Text(
                        text = evento.trabajadorNombre,
                        color = Color.White,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Black,
                        lineHeight = 22.sp,
                        maxLines = 2
                    )

                    if (evento.area.isNotBlank()) {
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = evento.area,
                            color = Slate400,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium
                        )
                    }

                    if (descLimpia.isNotBlank()) {
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = descLimpia,
                            color = Slate300,
                            fontSize = 12.5.sp,
                            lineHeight = 17.5.sp
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Fila 3: Contenedor elegante de Fecha Formateada en Español
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
                            imageVector = Icons.Default.CalendarMonth,
                            contentDescription = null,
                            tint = Amber400,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            val accionFecha = when {
                                esEnDescanso -> "Fin de descanso / Retorno a mina"
                                esPorBajar -> "Inicia descanso programado"
                                esVenta -> "Labora en taller hasta"
                                else -> "Fecha de programación"
                            }
                            Text(
                                text = accionFecha,
                                color = Slate400,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Medium
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = fechaLegible,
                                color = Color.White,
                                fontSize = 13.5.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
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
