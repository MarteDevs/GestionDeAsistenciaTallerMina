package com.mars.asistenciamina.ui.screens.home

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.ui.res.painterResource
import com.mars.asistenciamina.R
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Assignment
import androidx.compose.material.icons.filled.Bedtime
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Construction
import androidx.compose.material.icons.filled.DirectionsRun
import androidx.compose.material.icons.filled.DoneAll
import androidx.compose.material.icons.filled.FlightTakeoff
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.NotificationsActive
import androidx.compose.material.icons.filled.NotificationsOff
import androidx.compose.material.icons.filled.Paid
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.RestartAlt
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.OutlinedButton
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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.mars.asistenciamina.data.models.EventoNotificacionDto
import com.mars.asistenciamina.data.models.TrabajadorDto
import com.mars.asistenciamina.ui.components.SkeletonItem
import com.mars.asistenciamina.ui.theme.Amber400
import com.mars.asistenciamina.ui.theme.Amber500
import com.mars.asistenciamina.ui.theme.Emerald500
import com.mars.asistenciamina.ui.theme.Rose500
import com.mars.asistenciamina.ui.theme.Violet400
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
    var showConfigModal by rememberSaveable { mutableStateOf(false) }
    var showNotificationsModal by rememberSaveable { mutableStateOf(false) }
    val descartadasIds = (state as? HomeUiState.Success)?.descartadas ?: SessionManager.getDescartadasIds()
    var ultimaAlertaSonadaTimestamp by remember { mutableStateOf(SessionManager.getUltimaAlertaSonadaTimestamp()) }

    // Auto-recarga automática al iniciar o cuando entra en foco la pantalla
    LaunchedEffect(Unit) {
        viewModel.cargarTurnos(null)
    }

    // Si hay eventos cargados, notificar automáticamente en la barra de notificaciones una sola vez por sesión
    LaunchedEffect(state) {
        if (state is HomeUiState.Success && !viewModel.yaNotificadoEstaSesion) {
            val eventos = (state as HomeUiState.Success).eventos
            if (eventos.isNotEmpty()) {
                NotificationHelper.notifyUpcomingShifts(context, eventos)
                viewModel.marcarNotificado()
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
                        modifier = Modifier
                            .padding(vertical = 4.dp)
                            .fillMaxWidth()
                    ) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(Slate900)
                                .border(1.dp, Slate800, RoundedCornerShape(10.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Image(
                                painter = painterResource(id = R.drawable.ic_logo_asistencia_mina),
                                contentDescription = "Logo Taller Mina",
                                modifier = Modifier.size(26.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                        // weight(1f) + maxLines=1: nunca envuelve a 2 líneas ni se recorta
                        // verticalmente contra la altura fija del TopAppBar.
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "TALLER MINA",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Black,
                                letterSpacing = 0.4.sp,
                                color = Color.White,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            Text(
                                text = if (usuarioActual != null) "Hola, ${usuarioActual.nombres.split(" ").firstOrNull() ?: usuarioActual.nombres}" else "Operación 30x10 Mina",
                                fontSize = 11.5.sp,
                                color = Slate400,
                                fontWeight = FontWeight.Medium,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }
                },
                actions = {
                    val eventosSuccess = (state as? HomeUiState.Success)?.eventos ?: emptyList()
                    val notificacionesActivas = remember(eventosSuccess, descartadasIds) {
                        eventosSuccess.filter { it.id !in descartadasIds }
                    }
                    val totalAlertasPendientes = notificacionesActivas.size

                    // Botón de notificaciones push de relevos
                    IconButton(
                        onClick = { showNotificationsModal = true },
                        modifier = Modifier.size(44.dp)
                    ) {
                        Box(modifier = Modifier.size(24.dp)) {
                            Icon(
                                imageVector = if (totalAlertasPendientes > 0) Icons.Default.NotificationsActive else Icons.Default.Notifications,
                                contentDescription = "Ver Notificaciones de Relevo",
                                tint = if (totalAlertasPendientes > 0) Amber400 else Slate400,
                                modifier = Modifier
                                    .size(24.dp)
                                    .align(Alignment.Center)
                            )
                            if (totalAlertasPendientes > 0) {
                                Box(
                                    modifier = Modifier
                                        .size(16.dp)
                                        .align(Alignment.TopEnd)
                                        .offset(x = 5.dp, y = (-5).dp)
                                        .clip(CircleShape)
                                        .background(Rose500)
                                        .border(1.5.dp, Slate950, CircleShape),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = if (totalAlertasPendientes > 9) "9+" else totalAlertasPendientes.toString(),
                                        color = Color.White,
                                        fontSize = 8.5.sp,
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
                // Una fila por colaborador activo, igual que la pizarra física: NOMBRE | INICIO | FIN | INGRESA
                val filasPizarra = remember(uiState.trabajadores) {
                    uiState.trabajadores
                        .mapNotNull { obtenerFilaWhiteboard(it) }
                        .sortedBy { it.nombres }
                }
                val descansoCount = filasPizarra.count { it.enDescanso }
                val enMinaCount = filasPizarra.size - descansoCount
                val ventasCount = uiState.eventos.count { it.tipo == "VENTA_ACTIVA" || it.tipo == "PERMISO_ACTIVO" }

                // BoxWithConstraints detecta el ancho real: en tableta/landscape centra el
                // contenido con un ancho máximo en vez de estirar tarjetas de borde a borde.
                BoxWithConstraints(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(innerPadding)
                ) {
                    val anchoContenido = if (maxWidth > 600.dp) 600.dp else maxWidth
                    LazyColumn(
                        modifier = Modifier
                            .width(anchoContenido)
                            .align(Alignment.TopCenter),
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
                                            text = "Ref: ${uiState.fechaReferencia}",
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
                                        titulo = "En Mina",
                                        valor = enMinaCount.toString(),
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

                    // Título de la sección: tablero tipo pizarra física
                    item {
                        Text(
                            text = "TABLERO DE RELEVOS 30x10 (${filasPizarra.size})",
                            color = Slate400,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 0.8.sp,
                            modifier = Modifier.padding(start = 20.dp, end = 20.dp, top = 14.dp, bottom = 8.dp)
                        )
                    }

                    if (filasPizarra.isEmpty()) {
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
                                        text = "No hay colaboradores con periodos 30x10 registrados",
                                        color = Slate400,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Medium
                                    )
                                }
                            }
                        }
                    } else {
                        item {
                            PizarraRelevosCard(filas = filasPizarra)
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

    // Modal Bottom Sheet de Centro de Notificaciones
    if (showNotificationsModal) {
        val notifSheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
        val eventos = (state as? HomeUiState.Success)?.eventos ?: emptyList()
        ModalBottomSheet(
            onDismissRequest = { showNotificationsModal = false },
            sheetState = notifSheetState,
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
            NotificacionesSheetContent(
                eventos = eventos,
                descartadasIds = descartadasIds,
                onDescartarTodas = {
                    val allIds = eventos.map { it.id }
                    viewModel.descartarNotificaciones(allIds)
                },
                onDescartarUna = { id ->
                    viewModel.descartarNotificacion(id)
                },
                onRestaurarTodas = {
                    viewModel.restaurarNotificaciones()
                },
                onHacerSonarAlertas = {
                    NotificationHelper.notifyUpcomingShifts(context, eventos)
                    // Las alertas que acaban de sonar se restauran para que se mantengan visibles
                    viewModel.restaurarNotificaciones()
                    ultimaAlertaSonadaTimestamp = SessionManager.getUltimaAlertaSonadaTimestamp()
                },
                onClose = { showNotificationsModal = false }
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
                            text = "Régimen Atípico 30x10",
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
fun NotificacionesSheetContent(
    eventos: List<EventoNotificacionDto>,
    descartadasIds: Set<String>,
    onDescartarTodas: () -> Unit,
    onDescartarUna: (String) -> Unit,
    onRestaurarTodas: () -> Unit,
    onHacerSonarAlertas: () -> Unit,
    onClose: () -> Unit
) {
    val notificacionesActivas = remember(eventos, descartadasIds) {
        eventos.filter { it.id !in descartadasIds }
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 12.dp)
            .padding(bottom = 28.dp)
    ) {
        // Encabezado Superior: Ícono, Título y Botones de Acción
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.weight(1f, fill = false)
            ) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(Amber500.copy(alpha = 0.15f))
                        .border(1.dp, Amber500.copy(alpha = 0.35f), RoundedCornerShape(12.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.NotificationsActive,
                        contentDescription = null,
                        tint = Amber400,
                        modifier = Modifier.size(22.dp)
                    )
                }
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Text(
                        text = "Centro de Alertas",
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Black,
                        color = Color.White
                    )
                    Text(
                        text = if (notificacionesActivas.isNotEmpty())
                            "${notificacionesActivas.size} alerta(s) de relevo"
                        else
                            "Bandeja limpia",
                        fontSize = 12.sp,
                        color = if (notificacionesActivas.isNotEmpty()) Amber400 else Emerald500,
                        fontWeight = FontWeight.Medium
                    )
                }
            }

            // Acciones a la derecha: Limpiar / Restaurar y Cerrar
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                if (notificacionesActivas.isNotEmpty()) {
                    Button(
                        onClick = onDescartarTodas,
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Rose500.copy(alpha = 0.15f),
                            contentColor = Rose500
                        ),
                        border = BorderStroke(1.dp, Rose500.copy(alpha = 0.35f)),
                        modifier = Modifier.height(36.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.DoneAll,
                            contentDescription = null,
                            tint = Rose500,
                            modifier = Modifier.size(15.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "Limpiar",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = Rose500
                        )
                    }
                } else if (eventos.isNotEmpty()) {
                    Button(
                        onClick = onRestaurarTodas,
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Slate800,
                            contentColor = Slate300
                        ),
                        border = BorderStroke(1.dp, Slate700),
                        modifier = Modifier.height(36.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.RestartAlt,
                            contentDescription = null,
                            tint = Slate300,
                            modifier = Modifier.size(15.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "Restaurar",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = Slate300
                        )
                    }
                }

                IconButton(
                    onClick = onClose,
                    modifier = Modifier.size(36.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "Cerrar",
                        tint = Slate400,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }
        }

        HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp), color = Slate800)

        // Banner para hacer sonar alertas de relevo manualmente
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 12.dp),
            shape = RoundedCornerShape(14.dp),
            colors = CardDefaults.cardColors(containerColor = Slate950),
            border = BorderStroke(1.dp, Slate800)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp, vertical = 10.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.weight(1f)
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
                            text = "Alertas de Relevos Programadas",
                            fontSize = 12.5.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Color.White
                        )
                        Text(
                            text = "Sonido prioritario en Día 0 y avisos a 1 y 2 días",
                            fontSize = 11.sp,
                            color = Slate400
                        )
                    }
                }
                Spacer(modifier = Modifier.width(8.dp))
                Button(
                    onClick = onHacerSonarAlertas,
                    contentPadding = PaddingValues(horizontal = 10.dp, vertical = 5.dp),
                    shape = RoundedCornerShape(10.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Amber500.copy(alpha = 0.18f),
                        contentColor = Amber400
                    ),
                    border = BorderStroke(1.dp, Amber500.copy(alpha = 0.4f)),
                    modifier = Modifier.height(34.dp)
                ) {
                    Text(
                        text = "Hacer Sonar",
                        fontSize = 11.5.sp,
                        fontWeight = FontWeight.Bold,
                        color = Amber400
                    )
                }
            }
        }

        // Lista de Notificaciones o Estado Vacío ("Bandeja Limpia")
        if (notificacionesActivas.isEmpty()) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 10.dp),
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = Slate950),
                border = BorderStroke(1.dp, Slate800)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 28.dp, horizontal = 20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Box(
                        modifier = Modifier
                            .size(52.dp)
                            .clip(CircleShape)
                            .background(Emerald500.copy(alpha = 0.15f))
                            .border(1.dp, Emerald500.copy(alpha = 0.35f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.CheckCircle,
                            contentDescription = null,
                            tint = Emerald500,
                            modifier = Modifier.size(28.dp)
                        )
                    }
                    Spacer(modifier = Modifier.height(14.dp))
                    Text(
                        text = "¡Bandeja de Alertas Limpia!",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "Has limpiado las alertas pendientes. Cuando suene una nueva notificación programada o un relevo del día, aparecerá aquí automáticamente.",
                        fontSize = 12.sp,
                        color = Slate400,
                        textAlign = TextAlign.Center,
                        lineHeight = 16.sp
                    )
                    if (eventos.isNotEmpty()) {
                        Spacer(modifier = Modifier.height(16.dp))
                        OutlinedButton(
                            onClick = onRestaurarTodas,
                            shape = RoundedCornerShape(12.dp),
                            border = BorderStroke(1.dp, Slate700)
                        ) {
                            Icon(
                                imageVector = Icons.Default.RestartAlt,
                                contentDescription = null,
                                tint = Slate300,
                                modifier = Modifier.size(15.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "Restaurar alertas archivadas",
                                fontSize = 12.sp,
                                color = Slate300,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(max = 480.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(notificacionesActivas, key = { it.id }) { notif ->
                    ItemNotificacionSheet(
                        evento = notif,
                        onDescartar = { onDescartarUna(notif.id) }
                    )
                }
            }
        }
    }
}

@Composable
fun ItemNotificacionSheet(
    evento: EventoNotificacionDto,
    onDescartar: () -> Unit
) {
    val esRetornoHoy = evento.tipo == "RETORNO_HOY"
    val esEnDescanso = evento.tipo == "EN_DESCANSO" || evento.tipo == "FIN_DESCANSO"
    val esPorBajar = evento.tipo == "INICIO_DESCANSO"
    val esVenta = evento.tipo == "VENTA_ACTIVA"

    val badgeColor = when {
        esRetornoHoy -> Emerald500
        esEnDescanso -> Violet500
        esPorBajar -> Amber400
        esVenta -> Emerald500
        else -> Rose500
    }

    val badgeLabel = when {
        esRetornoHoy -> "Ya en Mina"
        esEnDescanso -> "Retorno a Mina"
        esPorBajar -> "En Mina"
        esVenta -> "Venta de Descanso"
        else -> "Permiso Especial"
    }

    val iconVector = when {
        esRetornoHoy -> Icons.Default.Construction
        esEnDescanso -> Icons.Default.Bedtime
        esPorBajar -> Icons.Default.Construction
        esVenta -> Icons.Default.Paid
        else -> Icons.Default.Assignment
    }

    val fechaEfectiva = remember(evento) {
        obtenerFechaDashboard(evento)
    }

    val esEventoHoy = evento.esHoy || evento.diasRestantes <= 0

    val fechaLegible = remember(fechaEfectiva) {
        formatearFechaEspanol(fechaEfectiva)
    }

    val descLimpia = remember(evento.descripcion, evento.trabajadorNombre) {
        limpiarDescripcion(evento.descripcion, evento.trabajadorNombre)
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Slate950),
        border = BorderStroke(1.dp, Slate800)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp)
        ) {
            // Fila 1: Badge de Tipo + Contador de Días + Botón Descartar (X)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(badgeColor.copy(alpha = 0.16f))
                        .border(1.dp, badgeColor.copy(alpha = 0.45f), RoundedCornerShape(8.dp))
                        .padding(horizontal = 9.dp, vertical = 4.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = iconVector,
                            contentDescription = null,
                            tint = badgeColor,
                            modifier = Modifier.size(12.dp)
                        )
                        Spacer(modifier = Modifier.width(5.dp))
                        Text(
                            text = badgeLabel.uppercase(),
                            color = badgeColor,
                            fontSize = 10.5.sp,
                            fontWeight = FontWeight.Black,
                            letterSpacing = 0.4.sp
                        )
                    }
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(
                                if (esEventoHoy) Rose500.copy(alpha = 0.2f)
                                else Slate800
                            )
                            .border(
                                1.dp,
                                if (esEventoHoy) Rose500.copy(alpha = 0.6f) else Slate700,
                                RoundedCornerShape(8.dp)
                            )
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = when {
                                esRetornoHoy -> "¡Laborando hoy!"
                                esEnDescanso && esEventoHoy -> "Retorna mañana"
                                esEnDescanso -> "Retorna en ${evento.diasRestantes + 1}d"
                                esPorBajar && esEventoHoy -> "Baja hoy"
                                esPorBajar && evento.diasRestantes == 1 -> "Baja mañana"
                                esPorBajar -> "Baja en ${evento.diasRestantes}d"
                                esEventoHoy -> "¡HOY!"
                                else -> "En ${evento.diasRestantes}d"
                            },
                            color = if (esRetornoHoy) Emerald500 else if (esEventoHoy) Rose500 else Slate300,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    Spacer(modifier = Modifier.width(6.dp))

                    IconButton(
                        onClick = onDescartar,
                        modifier = Modifier.size(28.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Descartar alerta",
                            tint = Slate400,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Fila 2: Nombre de colaborador y área
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = evento.trabajadorNombre,
                    color = Color.White,
                    fontSize = 14.5.sp,
                    fontWeight = FontWeight.Bold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(6.dp))
                        .background(Slate900)
                        .border(1.dp, Slate800, RoundedCornerShape(6.dp))
                        .padding(horizontal = 6.dp, vertical = 2.dp)
                ) {
                    Text(
                        text = evento.area,
                        color = Slate400,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Medium
                    )
                }
            }

            Spacer(modifier = Modifier.height(6.dp))

            // Fila 3: Descripción simplificada y directa del relevo
            val textoSheet = when {
                esRetornoHoy -> "Trabajando en mina"
                esEnDescanso -> "Retorna a mina"
                esPorBajar -> "Próx. descanso"
                else -> descLimpia
            }
            Text(
                text = textoSheet,
                color = Slate300,
                fontSize = 12.sp,
                lineHeight = 16.sp
            )

            Spacer(modifier = Modifier.height(8.dp))

            // Fila 4: Fecha en español y alerta especial
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "📅 $fechaLegible",
                    color = Slate200,
                    fontSize = 11.5.sp,
                    fontWeight = FontWeight.SemiBold
                )

                if (esEventoHoy) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(Rose500.copy(alpha = 0.15f))
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = "🔔 Alerta de Hoy",
                            color = Rose500,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
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

/**
 * Garantiza que la fecha mostrada en el Dashboard coincida exactamente con la vista Colaboradores:
 * - Para colaboradores EN_DESCANSO: usa la fecha de retorno a taller (fechaRetorno o fechaFin + 1 día).
 * - Para próximas salidas a descanso u otros eventos: usa la fecha de inicio / evento programado.
 */
fun obtenerFechaDashboard(evento: EventoNotificacionDto): String {
    if (evento.tipo == "RETORNO_HOY") {
        return evento.fecha
    }
    val esEnDescanso = evento.tipo == "EN_DESCANSO" || evento.tipo == "FIN_DESCANSO"
    if (esEnDescanso) {
        val fechaRetorno = evento.detalle?.fechaRetorno?.take(10)
        if (!fechaRetorno.isNullOrBlank()) return fechaRetorno

        val fechaFin = evento.detalle?.fechaFin?.take(10)
        if (!fechaFin.isNullOrBlank()) {
            return try {
                LocalDate.parse(fechaFin).plusDays(1).toString()
            } catch (e: Exception) {
                evento.fecha
            }
        }
    }
    return evento.fecha
}

fun limpiarDescripcion(descripcion: String, trabajadorNombre: String): String {
    var limpia = descripcion
        .replace(Regex("""\s*\(\d{4}-\d{2}-\d{2}\)"""), "")
        .replace(Regex("""\s*\(\d{2}/\d{2}/\d{4}\)"""), "")
        .trim()

    val fmtCorto = java.time.format.DateTimeFormatter.ofPattern("dd MMM", Locale.forLanguageTag("es-PE"))
    limpia = Regex("""\b\d{4}-\d{2}-\d{2}\b""").replace(limpia) { match ->
        try {
            LocalDate.parse(match.value).format(fmtCorto)
        } catch (e: Exception) {
            match.value
        }
    }

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
        val localePe = Locale.forLanguageTag("es-PE")
        val diaSem = d.dayOfWeek.getDisplayName(java.time.format.TextStyle.FULL, localePe)
            .replaceFirstChar { it.uppercase() }
        val mes = d.month.getDisplayName(java.time.format.TextStyle.FULL, localePe)
            .replaceFirstChar { it.uppercase() }
        "$diaSem, ${d.dayOfMonth} de $mes de ${d.year}"
    } catch (e: Exception) {
        fechaIso
    }
}

/**
 * Una fila de la pizarra física de relevos: nombre + fechas INICIO / FIN / INGRESA
 * del periodo de descanso vigente (si está hoy en descanso) o del próximo programado.
 */
data class FilaWhiteboard(
    val trabajadorId: Int,
    val nombres: String,
    val area: String,
    val inicio: LocalDate,
    val fin: LocalDate,
    val ingresa: LocalDate,
    val enDescanso: Boolean
)

/**
 * Misma regla de selección que [obtenerEstadoOperativo] en TrabajadoresScreen (descanso activo
 * hoy, si no el próximo futuro) pero devolviendo las fechas crudas para las 3 columnas de la pizarra.
 */
fun obtenerFilaWhiteboard(
    trabajador: TrabajadorDto,
    hoy: LocalDate = LocalDate.now()
): FilaWhiteboard? {
    val periodos = trabajador.descansos.mapNotNull { d ->
        try {
            Triple(d, LocalDate.parse(d.fechaInicio.take(10)), LocalDate.parse(d.fechaFin.take(10)))
        } catch (e: Exception) {
            null
        }
    }

    val activo = periodos.firstOrNull { (_, ini, fin) -> !hoy.isBefore(ini) && !hoy.isAfter(fin) }
    // El descanso que terminó ayer se mantiene visible el día de retorno (ya en mina trabajando hoy)
    val retornoHoy = periodos.firstOrNull { (_, _, fin) -> fin.plusDays(1) == hoy }
    val (_, ini, fin) = activo
        ?: retornoHoy
        ?: periodos.filter { it.second.isAfter(hoy) }.minByOrNull { it.second }
        ?: return null

    return FilaWhiteboard(
        trabajadorId = trabajador.id,
        nombres = trabajador.nombres,
        area = trabajador.area,
        inicio = ini,
        fin = fin,
        ingresa = fin.plusDays(1),
        enDescanso = activo != null
    )
}

private val MESES_CORTOS_PIZARRA = arrayOf(
    "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Set", "Oct", "Nov", "Dic"
)

fun formatearFechaPizarra(fecha: LocalDate): String =
    "%02d-%s".format(fecha.dayOfMonth, MESES_CORTOS_PIZARRA[fecha.monthValue - 1])

/** Filtro de estado del tablero. TODOS no oculta nada; el resto muestra solo esa sección. */
private enum class FiltroPizarra { TODOS, REGRESAN, DESCANSO, EN_MINA }

private data class GrupoPizarra(
    val filtro: FiltroPizarra,
    val titulo: String,
    val color: Color,
    val icono: ImageVector,
    val filas: List<FilaWhiteboard>
)

/**
 * Texto vs. relleno: Violet500 da 4.2:1 sobre Slate900 (bajo el mínimo AA de 4.5:1 para texto),
 * pero sí sirve para el punto/relleno no-textual (WCAG 1.4.11 solo exige 3:1 ahí).
 */
private fun colorTextoPizarra(colorRelleno: Color): Color =
    if (colorRelleno == Violet500) Violet400 else colorRelleno

@Composable
fun PizarraRelevosCard(filas: List<FilaWhiteboard>) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Slate900),
        border = BorderStroke(1.dp, Slate800)
    ) {
        Column(modifier = Modifier.fillMaxWidth()) {
            val hoy = remember { LocalDate.now() }
            val grupos = remember(filas, hoy) {
                listOf(
                    GrupoPizarra(FiltroPizarra.REGRESAN, "REGRESAN A MINA", Emerald500, Icons.Default.DirectionsRun, filas.filter { esIngresaProximo(it, hoy) }),
                    GrupoPizarra(FiltroPizarra.DESCANSO, "EN DESCANSO", Violet500, Icons.Default.Bedtime, filas.filter { it.enDescanso && !esIngresaProximo(it, hoy) }),
                    GrupoPizarra(FiltroPizarra.EN_MINA, "EN MINA TRABAJANDO", Amber400, Icons.Default.Construction, filas.filter { !it.enDescanso && !esIngresaProximo(it, hoy) })
                )
            }
            var filtro by rememberSaveable { mutableStateOf(FiltroPizarra.TODOS) }

            FiltrosPizarraRow(total = filas.size, grupos = grupos, filtroActivo = filtro, onFiltroChange = { filtro = it })
            HorizontalDivider(color = Slate800)

            grupos.forEach { grupo ->
                if (filtro != FiltroPizarra.TODOS && filtro != grupo.filtro) return@forEach
                if (grupo.filas.isEmpty()) return@forEach
                SeccionPizarraHeader(titulo = grupo.titulo, color = grupo.color, icono = grupo.icono, cantidad = grupo.filas.size)
                grupo.filas.forEachIndexed { index, fila ->
                    FilaPizarraRow(fila = fila, hoy = hoy)
                    if (index != grupo.filas.lastIndex) {
                        HorizontalDivider(
                            color = Rose500.copy(alpha = 0.25f),
                            thickness = 1.dp,
                            modifier = Modifier.padding(horizontal = 10.dp)
                        )
                    }
                }
            }
        }
    }
}

fun esIngresaProximo(fila: FilaWhiteboard, hoy: LocalDate): Boolean =
    !fila.ingresa.isBefore(hoy) && !fila.ingresa.isAfter(hoy.plusDays(1))

/** Color de estado operativo del colaborador: urgente > en descanso > en mina. */
private fun colorEstadoPizarra(fila: FilaWhiteboard, ingresaProximo: Boolean): Color = when {
    ingresaProximo -> Emerald500
    fila.enDescanso -> Violet500
    else -> Amber400
}

@Composable
private fun FiltrosPizarraRow(
    total: Int,
    grupos: List<GrupoPizarra>,
    filtroActivo: FiltroPizarra,
    onFiltroChange: (FiltroPizarra) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .horizontalScroll(rememberScrollState())
            .padding(horizontal = 10.dp, vertical = 10.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        ChipFiltroPizarra(
            texto = "Todos ($total)",
            seleccionado = filtroActivo == FiltroPizarra.TODOS,
            color = Slate300,
            onClick = { onFiltroChange(FiltroPizarra.TODOS) }
        )
        grupos.forEach { grupo ->
            ChipFiltroPizarra(
                texto = "${grupo.titulo.lowercase().replaceFirstChar { it.uppercase() }} (${grupo.filas.size})",
                seleccionado = filtroActivo == grupo.filtro,
                color = grupo.color,
                onClick = { onFiltroChange(grupo.filtro) }
            )
        }
    }
}

@Composable
private fun ChipFiltroPizarra(texto: String, seleccionado: Boolean, color: Color, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(10.dp))
            .background(if (seleccionado) color.copy(alpha = 0.18f) else Slate950)
            .border(1.dp, if (seleccionado) color.copy(alpha = 0.6f) else Slate800, RoundedCornerShape(10.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 11.dp, vertical = 6.dp)
    ) {
        Text(
            text = texto,
            color = if (seleccionado) colorTextoPizarra(color) else Slate400,
            fontSize = 10.5.sp,
            fontWeight = if (seleccionado) FontWeight.Black else FontWeight.SemiBold
        )
    }
}

@Composable
private fun SeccionPizarraHeader(titulo: String, color: Color, icono: ImageVector, cantidad: Int) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(color.copy(alpha = 0.12f))
            .padding(horizontal = 10.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = icono,
            contentDescription = null,
            tint = color,
            modifier = Modifier.size(13.dp)
        )
        Spacer(modifier = Modifier.width(7.dp))
        Text(
            text = titulo,
            color = colorTextoPizarra(color),
            fontSize = 10.sp,
            fontWeight = FontWeight.Black,
            letterSpacing = 0.5.sp,
            modifier = Modifier.weight(1f)
        )
        Text(
            text = cantidad.toString(),
            color = colorTextoPizarra(color),
            fontSize = 10.sp,
            fontWeight = FontWeight.Black
        )
    }
}

/**
 * Fila de dos líneas: el nombre ocupa todo el ancho de la tarjeta (nunca compite por espacio
 * con las fechas, así no se corta con nombres compuestos largos) y las 3 fechas van debajo,
 * compactas y con su propia etiqueta — ya no dependen de un encabezado de columna alineado.
 */
@Composable
private fun FilaPizarraRow(fila: FilaWhiteboard, hoy: LocalDate) {
    val ingresaProximo = esIngresaProximo(fila, hoy)
    val colorEstado = colorEstadoPizarra(fila, ingresaProximo)

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 10.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(7.dp)
                    .clip(CircleShape)
                    .background(colorEstado)
            )
            Spacer(modifier = Modifier.width(7.dp))
            Text(
                text = fila.nombres,
                color = Color.White,
                fontSize = 13.5.sp,
                fontWeight = FontWeight.Bold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.weight(1f)
            )
            if (fila.area.isNotBlank()) {
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = fila.area,
                    color = Slate400,
                    fontSize = 10.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }
        Spacer(modifier = Modifier.height(6.dp))
        Row(modifier = Modifier.fillMaxWidth()) {
            MiniFechaPizarra(etiqueta = "INICIO", valor = formatearFechaPizarra(fila.inicio), color = Slate200)
            MiniFechaPizarra(etiqueta = "FIN", valor = formatearFechaPizarra(fila.fin), color = Slate200)
            MiniFechaPizarra(etiqueta = "INGRESA", valor = formatearFechaPizarra(fila.ingresa), color = colorTextoPizarra(colorEstado), destacado = true)
        }
    }
}

@Composable
private fun RowScope.MiniFechaPizarra(etiqueta: String, valor: String, color: Color, destacado: Boolean = false) {
    Column(modifier = Modifier.weight(1f)) {
        Text(
            text = etiqueta,
            color = Slate400,
            fontSize = 8.5.sp,
            fontWeight = FontWeight.Black,
            letterSpacing = 0.4.sp
        )
        Text(
            text = valor,
            color = color,
            fontSize = if (destacado) 13.sp else 11.5.sp,
            fontWeight = if (destacado) FontWeight.Black else FontWeight.SemiBold
        )
    }
}

