package com.mars.asistenciamina.ui.screens.detalle

import androidx.compose.animation.AnimatedVisibility
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.DoneAll
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Sell
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mars.asistenciamina.data.api.ApiClient
import com.mars.asistenciamina.data.models.DescansoDto
import com.mars.asistenciamina.data.models.ExcepcionRangoRequest
import com.mars.asistenciamina.data.models.TrabajadorDto
import com.mars.asistenciamina.ui.theme.Amber400
import com.mars.asistenciamina.ui.theme.Amber500
import com.mars.asistenciamina.ui.theme.Cyan500
import com.mars.asistenciamina.ui.theme.Emerald500
import com.mars.asistenciamina.ui.theme.Rose500
import com.mars.asistenciamina.ui.theme.Slate200
import com.mars.asistenciamina.ui.theme.Slate400
import com.mars.asistenciamina.ui.theme.Slate700
import com.mars.asistenciamina.ui.theme.Slate800
import com.mars.asistenciamina.ui.theme.Slate900
import com.mars.asistenciamina.ui.theme.Slate950
import kotlinx.coroutines.launch
import java.time.LocalDate

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DetalleTrabajadorScreen(
    trabajador: TrabajadorDto,
    onBack: () -> Unit
) {
    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()
    var selectedDescanso by remember { mutableStateOf<DescansoDto?>(trabajador.descansos.firstOrNull()) }
    val selectedFechas = remember { mutableStateListOf<String>() }
    var guardando by remember { mutableStateOf(false) }

    val diasDelBloque = remember(selectedDescanso?.id) {
        selectedDescanso?.let { d ->
            try {
                val inicio = LocalDate.parse(d.fechaInicio.take(10))
                val fin = LocalDate.parse(d.fechaFin.take(10))
                val lista = mutableListOf<String>()
                var curr = inicio
                while (!curr.isAfter(fin)) {
                    lista.add(curr.toString())
                    curr = curr.plusDays(1)
                }
                lista
            } catch (e: Exception) {
                emptyList()
            }
        } ?: emptyList()
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            CenterAlignedTopAppBar(
                colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
                    containerColor = Slate950,
                    titleContentColor = Color.White
                ),
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(imageVector = Icons.Default.ArrowBack, contentDescription = "Atrás", tint = Color.White)
                    }
                },
                title = {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = trabajador.nombres,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            maxLines = 1
                        )
                        Text(
                            text = "Turno Atípico 20x10",
                            fontSize = 10.sp,
                            color = Slate400
                        )
                    }
                }
            )
        },
        containerColor = Slate950,
        bottomBar = {
            if (selectedFechas.isNotEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Slate900)
                        .padding(16.dp)
                ) {
                    Button(
                        onClick = {
                            scope.launch {
                                guardando = true
                                try {
                                    ApiClient.apiService.registrarExcepcionRango(
                                        ExcepcionRangoRequest(
                                            trabajadorId = trabajador.id,
                                            fechas = selectedFechas.toList(),
                                            tipo = "VENTA_DESCANSO",
                                            observacion = "Venta registrada desde App Android Móvil"
                                        )
                                    )
                                    snackbarHostState.showSnackbar("¡${selectedFechas.size} días guardados como Venta (VD)!")
                                    selectedFechas.clear()
                                } catch (e: Exception) {
                                    snackbarHostState.showSnackbar("Error: ${e.localizedMessage}")
                                } finally {
                                    guardando = false
                                }
                            }
                        },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = Amber500),
                        shape = RoundedCornerShape(14.dp),
                        enabled = !guardando
                    ) {
                        if (guardando) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(18.dp),
                                color = Slate950,
                                strokeWidth = 2.dp
                            )
                        } else {
                            Icon(imageVector = Icons.Default.Sell, contentDescription = null, tint = Slate950)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Registrar Venta (${selectedFechas.size} Días)",
                                color = Slate950,
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.sp
                            )
                        }
                    }
                }
            }
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Card informativa de Ciclo
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.cardColors(containerColor = Slate900)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(imageVector = Icons.Default.Info, contentDescription = null, tint = Amber400, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(text = "RÉGIMEN 20 TRABAJO x 10 DESCANSO", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Amber400)
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "Selecciona un bloque de descanso programado abajo para ver y marcar los días disponibles a vender (VD) o adelantar en mina.",
                            fontSize = 11.sp,
                            color = Slate400,
                            lineHeight = 15.sp
                        )
                    }
                }
            }

            // Selector de Bloques de Descanso
            item {
                Text(
                    text = "BLOQUES DE DESCANSO 2026",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = Slate400,
                    letterSpacing = 1.sp
                )
            }

            items(trabajador.descansos) { descanso ->
                val esSeleccionado = selectedDescanso?.id == descanso.id

                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable {
                            selectedDescanso = descanso
                            selectedFechas.clear()
                        },
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = if (esSeleccionado) Slate800 else Slate900
                    )
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(34.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(if (esSeleccionado) Amber500 else Slate700),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "#${descanso.cicloNro}",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (esSeleccionado) Slate950 else Color.White
                                )
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text(
                                    text = "${descanso.fechaInicio.take(10)} al ${descanso.fechaFin.take(10)}",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                                Text(
                                    text = "${descanso.diasTotales} días libres programados",
                                    fontSize = 10.sp,
                                    color = Slate400
                                )
                            }
                        }

                        if (esSeleccionado) {
                            Icon(imageVector = Icons.Default.Check, contentDescription = null, tint = Amber400, modifier = Modifier.size(18.dp))
                        }
                    }
                }
            }

            // Desglose interactivo de los días del bloque seleccionado
            if (selectedDescanso != null && diasDelBloque.isNotEmpty()) {
                item {
                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        text = "DÍAS DEL PERIODO (MARCAR PARA VENDER / ADELANTAR)",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = Slate400,
                        letterSpacing = 1.sp
                    )
                }

                items(diasDelBloque) { diaIso ->
                    val isChecked = selectedFechas.contains(diaIso)

                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                if (isChecked) selectedFechas.remove(diaIso)
                                else selectedFechas.add(diaIso)
                            },
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = if (isChecked) Amber500.copy(alpha = 0.15f) else Slate900
                        )
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 14.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Checkbox(
                                    checked = isChecked,
                                    onCheckedChange = {
                                        if (it) selectedFechas.add(diaIso)
                                        else selectedFechas.remove(diaIso)
                                    },
                                    colors = CheckboxDefaults.colors(
                                        checkedColor = Amber500,
                                        checkmarkColor = Slate950,
                                        uncheckedColor = Slate700
                                    )
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = diaIso,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = if (isChecked) Amber400 else Slate200
                                )
                            }

                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(if (isChecked) Amber500.copy(alpha = 0.2f) else Slate800)
                                    .padding(horizontal = 8.dp, vertical = 3.dp)
                            ) {
                                Text(
                                    text = if (isChecked) "SELECCIONADO" else "DISPONIBLE",
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (isChecked) Amber400 else Emerald500
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
