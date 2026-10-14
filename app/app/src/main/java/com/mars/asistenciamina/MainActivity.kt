package com.mars.asistenciamina

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
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
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mars.asistenciamina.data.models.TrabajadorDto
import com.mars.asistenciamina.ui.screens.detalle.DetalleTrabajadorScreen
import com.mars.asistenciamina.ui.screens.home.HomeScreen
import com.mars.asistenciamina.ui.screens.trabajadores.TrabajadoresScreen
import com.mars.asistenciamina.ui.theme.Amber400
import com.mars.asistenciamina.ui.theme.Amber500
import com.mars.asistenciamina.ui.theme.AsistenciaMinaTheme
import com.mars.asistenciamina.ui.theme.Slate400
import com.mars.asistenciamina.ui.theme.Slate800
import com.mars.asistenciamina.ui.theme.Slate900
import com.mars.asistenciamina.ui.theme.Slate950

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
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

@Composable
fun AsistenciaMinaApp() {
    var currentTab by rememberSaveable { mutableStateOf(NavigationTab.HOME) }
    var selectedTrabajador by rememberSaveable { mutableStateOf<TrabajadorDto?>(null) }

    if (selectedTrabajador != null) {
        DetalleTrabajadorScreen(
            trabajador = selectedTrabajador!!,
            onBack = { selectedTrabajador = null }
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
                                    fontSize = 11.sp
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
                            onNavigateToTrabajadores = { currentTab = NavigationTab.EQUIPO }
                        )
                    }
                    NavigationTab.EQUIPO -> {
                        TrabajadoresScreen(
                            onSelectTrabajador = { trabajador ->
                                selectedTrabajador = trabajador
                            }
                        )
                    }
                }
            }
        }
    }
}