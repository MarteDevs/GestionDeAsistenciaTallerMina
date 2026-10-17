package com.mars.asistenciamina

import android.Manifest
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.People
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mars.asistenciamina.data.local.SessionManager
import com.mars.asistenciamina.data.models.TrabajadorDto
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import com.mars.asistenciamina.ui.screens.detalle.DetalleTrabajadorScreen
import com.mars.asistenciamina.ui.screens.home.HomeScreen
import com.mars.asistenciamina.ui.screens.login.LoginScreen
import com.mars.asistenciamina.ui.screens.trabajadores.TrabajadoresScreen
import com.mars.asistenciamina.ui.theme.Amber400
import com.mars.asistenciamina.ui.theme.Amber500
import com.mars.asistenciamina.ui.theme.AsistenciaMinaTheme
import com.mars.asistenciamina.ui.theme.Slate400
import com.mars.asistenciamina.ui.theme.Slate900
import com.mars.asistenciamina.ui.theme.Slate950
import com.mars.asistenciamina.util.NotificationHelper

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        SessionManager.init(this)
        NotificationHelper.createNotificationChannel(this)
        enableEdgeToEdge()
        setContent {
            AsistenciaMinaTheme(darkTheme = true) {
                AsistenciaMinaApp()
            }
        }
    }
}

enum class NavigationTab(
    val label: String,
    val icon: ImageVector
) {
    HOME("Turnos Hoy", Icons.Default.Home),
    EQUIPO("Colaboradores", Icons.Default.People)
}

private val appJson = Json {
    ignoreUnknownKeys = true
    coerceInputValues = true
}

@Composable
fun AsistenciaMinaApp() {
    val context = LocalContext.current
    var isAuthenticated by rememberSaveable { mutableStateOf(SessionManager.isLoggedIn()) }
    var currentTab by rememberSaveable { mutableStateOf(NavigationTab.HOME) }
    var selectedTrabajadorJson by rememberSaveable { mutableStateOf<String?>(null) }
    val selectedTrabajador = remember(selectedTrabajadorJson) {
        selectedTrabajadorJson?.let {
            try {
                appJson.decodeFromString<TrabajadorDto>(it)
            } catch (e: Exception) {
                null
            }
        }
    }

    // Solicitar permisos de notificación en Android 13+ (TIRAMISU)
    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { _ -> }

    LaunchedEffect(Unit) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
        }
    }

    if (!isAuthenticated) {
        LoginScreen(
            onLoginSuccess = {
                isAuthenticated = true
            }
        )
    } else if (selectedTrabajador != null) {
        DetalleTrabajadorScreen(
            trabajador = selectedTrabajador,
            onBack = { selectedTrabajadorJson = null }
        )
    } else {
        Scaffold(
            modifier = Modifier.fillMaxSize(),
            containerColor = Slate950,
            bottomBar = {
                NavigationBar(
                    containerColor = Slate900,
                    tonalElevation = 8.dp
                ) {
                    NavigationTab.entries.forEach { tab ->
                        val selected = tab == currentTab
                        NavigationBarItem(
                            icon = {
                                Icon(
                                    imageVector = tab.icon,
                                    contentDescription = tab.label
                                )
                            },
                            label = {
                                Text(
                                    text = tab.label,
                                    fontSize = 12.sp,
                                    fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium
                                )
                            },
                            selected = selected,
                            onClick = { currentTab = tab },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = Slate950,
                                selectedTextColor = Amber400,
                                indicatorColor = Amber500,
                                unselectedIconColor = Slate400,
                                unselectedTextColor = Slate400
                            )
                        )
                    }
                }
            }
        ) { innerPadding ->
            AnimatedContent(
                targetState = currentTab,
                transitionSpec = { fadeIn() togetherWith fadeOut() },
                modifier = Modifier.padding(innerPadding),
                label = "tab_transition"
            ) { tab ->
                when (tab) {
                    NavigationTab.HOME -> {
                        HomeScreen(
                            onNavigateToTrabajadores = { currentTab = NavigationTab.EQUIPO },
                            onLogout = {
                                SessionManager.clearSession()
                                isAuthenticated = false
                            }
                        )
                    }
                    NavigationTab.EQUIPO -> {
                        TrabajadoresScreen(
                            onSelectTrabajador = { trabajador ->
                                selectedTrabajadorJson = kotlinx.serialization.json.Json.encodeToString(trabajador)
                            }
                        )
                    }
                }
            }
        }
    }
}