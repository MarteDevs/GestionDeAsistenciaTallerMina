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
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material3.TopAppBar
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
import com.mars.asistenciamina.ui.theme.Violet500
import com.mars.asistenciamina.ui.theme.Slate200
import com.mars.asistenciamina.ui.theme.Slate300
import com.mars.asistenciamina.ui.theme.Slate400
import com.mars.asistenciamina.ui.theme.Slate700
import com.mars.asistenciamina.ui.theme.Slate800
import com.mars.asistenciamina.ui.theme.Slate900
import com.mars.asistenciamina.ui.theme.Slate950
import androidx.compose.foundation.border
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale

import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedVisibility

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DetalleTrabajadorScreen(
    trabajador: TrabajadorDto,
    onBack: () -> Unit
) {
    BackHandler(onBack = onBack)

    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()

    // Preseleccionar inteligentemente el ciclo [EN CURSO] o el próximo descanso en lugar del primer ciclo de enero
    val defaultDescanso = remember(trabajador.descansos) {
        if (trabajador.descansos.isEmpty()) return@remember null
        val hoy = LocalDate.now()

        // 1. ¿Hay algún descanso en curso hoy?
        val enCurso = trabajador.descansos.firstOrNull { d ->
            try {
                val ini = LocalDate.parse(d.fechaInicio.take(10))
                val fin = LocalDate.parse(d.fechaFin.take(10))
                !hoy.isBefore(ini) && !hoy.isAfter(fin)
            } catch (e: Exception) {
                false
            }
        }
        if (enCurso != null) return@remember enCurso

        // 2. Si no, buscar el próximo descanso futuro más cercano
        val proximo = trabajador.descansos
            .mapNotNull { d ->
                try {
                    val ini = LocalDate.parse(d.fechaInicio.take(10))
                    if (ini.isAfter(hoy)) Pair(d, ini) else null
                } catch (e: Exception) {
                    null
                }
            }
            .minByOrNull { it.second }
            ?.first
        if (proximo != null) return@remember proximo

        // 3. Fallback: el último registrado
        trabajador.descansos.lastOrNull()
    }

    var selectedDescanso by remember { mutableStateOf<DescansoDto?>(defaultDescanso) }
    val selectedFechas = remember { mutableStateListOf<String>() }
    val fechasYaVendidas = remember { mutableStateListOf<String>() }
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
            TopAppBar(
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Slate950,
                    titleContentColor = Color.White
                ),
                navigationIcon = {
                    IconButton(onClick = onBack, modifier = Modifier.size(44.dp)) {
                        Icon(imageVector = Icons.Default.ArrowBack, contentDescription = "Atrás", tint = Color.White)
                    }
                },
                title = {
                    Column {
                        Text(
                            text = trabajador.nombres,
                            fontSize = 17.sp,
                            fontWeight = FontWeight.Black,
                            letterSpacing = 0.5.sp,
                            maxLines = 1,
                            color = Color.White
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = "Turno Atípico 20x10 • ${trabajador.area.ifBlank { "Taller Mina" }}",
                            fontSize = 12.sp,
                            color = Slate400,
                            fontWeight = FontWeight.Medium
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
                            if (selectedFechas.size > 5) {
                                scope.launch { snackbarHostState.showSnackbar("Régimen 20x10: Máximo 5 días de venta por ciclo.") }
                                return@Button
                            }
                            scope.launch {
                                guardando = true
                                try {
                                    val res = ApiClient.apiService.registrarExcepcionRango(
                                        ExcepcionRangoRequest(
                                            trabajadorId = trabajador.id,
                                            fechas = selectedFechas.toList(),
                                            tipo = "VENTA_DESCANSO",
                                            motivo = "Venta registrada desde App Android Móvil"
                                        )
                                    )
                                    snackbarHostState.showSnackbar(res.message.ifBlank { "¡${selectedFechas.size} días guardados como Venta (VD)!" })
                                    fechasYaVendidas.addAll(selectedFechas)
                                    selectedFechas.clear()
                                } catch (e: Exception) {
                                    snackbarHostState.showSnackbar("Error: ${e.localizedMessage}")
                                } finally {
                                    guardando = false
                                }
                            }
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(52.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Amber500),
                        shape = RoundedCornerShape(14.dp),
                        enabled = !guardando
                    ) {
                        if (guardando) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(20.dp),
                                color = Slate950,
                                strokeWidth = 2.5.dp
                            )
                        } else {
                            Icon(imageVector = Icons.Default.Sell, contentDescription = null, tint = Slate950)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Registrar Venta (${selectedFechas.size} Días)",
                                color = Slate950,
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp
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
                    Column(modifier = Modifier.padding(18.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(imageVector = Icons.Default.Info, contentDescription = null, tint = Amber400, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(text = "RÉGIMEN 20 TRABAJO x 10 DESCANSO", fontSize = 12.5.sp, fontWeight = FontWeight.Bold, color = Amber400)
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Selecciona un bloque de descanso programado abajo para ver y marcar los días disponibles a vender (VD) o adelantar en mina.",
                            fontSize = 12.5.sp,
                            color = Slate300,
                            lineHeight = 18.sp
                        )
                    }
                }
            }

            // Selector de Bloques de Descanso
            item {
                Text(
                    text = "BLOQUES DE DESCANSO 2026",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = Slate400,
                    letterSpacing = 0.8.sp
                )
            }

            itemsIndexed(trabajador.descansos) { index, descanso ->
                val esSeleccionado = selectedDescanso?.id == descanso.id
                val hoy = remember { LocalDate.now() }
                val numeroCiclo = index + 1

                val (esActivoHoy, esProximo, rangoTexto) = remember(descanso.id) {
                    try {
                        val ini = LocalDate.parse(descanso.fechaInicio.take(10))
                        val fin = LocalDate.parse(descanso.fechaFin.take(10))
                        val activo = !hoy.isBefore(ini) && !hoy.isAfter(fin)
                        val proximo = ini.isAfter(hoy) && ini.isBefore(hoy.plusDays(30))
                        val fmt = DateTimeFormatter.ofPattern("dd MMM", Locale("es", "PE"))
                        val iniStr = ini.format(fmt).replaceFirstChar { it.uppercase() }
                        val finStr = fin.format(fmt).replaceFirstChar { it.uppercase() }
                        val str = "$iniStr al $finStr (${fin.year})"
                        Triple(activo, proximo, str)
                    } catch (e: Exception) {
                        Triple(false, false, "${descanso.fechaInicio.take(10)} al ${descanso.fechaFin.take(10)}")
                    }
                }

                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable {
                            selectedDescanso = descanso
                            selectedFechas.clear()
                        },
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = if (esSeleccionado) Slate800 else Slate900
                    ),
                    border = if (esSeleccionado) {
                        androidx.compose.foundation.BorderStroke(2.dp, Amber500)
                    } else {
                        androidx.compose.foundation.BorderStroke(1.dp, Slate800)
                    }
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(18.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.weight(1f)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(48.dp)
                                    .clip(RoundedCornerShape(14.dp))
                                    .background(
                                        if (esSeleccionado) Amber500
                                        else if (esActivoHoy) Violet500.copy(alpha = 0.25f)
                                        else Slate800
                                    )
                                    .border(
                                        1.dp,
                                        if (esSeleccionado) Amber500
                                        else if (esActivoHoy) Violet500
                                        else Slate700,
                                        RoundedCornerShape(14.dp)
                                    ),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "#$numeroCiclo",
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.Black,
                                    color = if (esSeleccionado) Slate950 else if (esActivoHoy) Violet500 else Color.White
                                )
                            }

                            Spacer(modifier = Modifier.width(14.dp))

                            Column {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(
                                        text = rangoTexto,
                                        fontSize = 15.5.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color.White
                                    )
                                    if (esActivoHoy) {
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Box(
                                            modifier = Modifier
                                                .clip(RoundedCornerShape(6.dp))
                                                .background(Violet500.copy(alpha = 0.2f))
                                                .border(1.dp, Violet500.copy(alpha = 0.6f), RoundedCornerShape(6.dp))
                                                .padding(horizontal = 7.dp, vertical = 2.dp)
                                        ) {
                                            Text(
                                                text = "EN CURSO",
                                                color = Violet500,
                                                fontSize = 10.sp,
                                                fontWeight = FontWeight.Black
                                            )
                                        }
                                    } else if (esProximo) {
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Box(
                                            modifier = Modifier
                                                .clip(RoundedCornerShape(6.dp))
                                                .background(Amber400.copy(alpha = 0.15f))
                                                .border(1.dp, Amber400.copy(alpha = 0.5f), RoundedCornerShape(6.dp))
                                                .padding(horizontal = 7.dp, vertical = 2.dp)
                                        ) {
                                            Text(
                                                text = "PRÓXIMO",
                                                color = Amber400,
                                                fontSize = 10.sp,
                                                fontWeight = FontWeight.Black
                                            )
                                        }
                                    }
                                }

                                Spacer(modifier = Modifier.height(4.dp))

                                Text(
                                    text = "Periodo #$numeroCiclo • ${descanso.diasTotales} días de descanso",
                                    fontSize = 12.5.sp,
                                    color = Slate400,
                                    fontWeight = FontWeight.Medium
                                )
                            }
                        }

                        if (esSeleccionado) {
                            Box(
                                modifier = Modifier
                                    .size(28.dp)
                                    .clip(androidx.compose.foundation.shape.CircleShape)
                                    .background(Amber500),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Check,
                                    contentDescription = null,
                                    tint = Slate950,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        }
                    }
                }
            }

            // Desglose interactivo de los días del bloque seleccionado
            if (selectedDescanso != null && diasDelBloque.isNotEmpty()) {
                item {
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "DÍAS DEL PERIODO (MARCAR PARA VENDER / ADELANTAR)",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = Slate400,
                        letterSpacing = 0.8.sp
                    )
                }

                items(diasDelBloque) { diaIso ->
                    val isChecked = selectedFechas.contains(diaIso)

                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                if (isChecked) {
                                    selectedFechas.remove(diaIso)
                                } else {
                                    if (selectedFechas.size >= 5) {
                                        scope.launch { snackbarHostState.showSnackbar("Régimen 20x10: Solo se permite vender hasta 5 días por ciclo.") }
                                    } else {
                                        selectedFechas.add(diaIso)
                                    }
                                }
                            },
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = if (isChecked) Amber500.copy(alpha = 0.15f) else Slate900
                        ),
                        border = if (isChecked) {
                            androidx.compose.foundation.BorderStroke(1.5.dp, Amber500)
                        } else {
                            androidx.compose.foundation.BorderStroke(1.dp, Slate800)
                        }
                    ) {
                        val yaVendida = diaIso in fechasYaVendidas
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp, vertical = 12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.weight(1f)
                            ) {
                                Checkbox(
                                    checked = isChecked,
                                    enabled = !yaVendida,
                                    onCheckedChange = { check ->
                                        if (yaVendida) return@Checkbox
                                        if (check) {
                                            if (selectedFechas.size >= 5) {
                                                scope.launch { snackbarHostState.showSnackbar("Régimen 20x10: Solo se permite vender hasta 5 días por ciclo.") }
                                            } else {
                                                selectedFechas.add(diaIso)
                                            }
                                        } else {
                                            selectedFechas.remove(diaIso)
                                        }
                                    },
                                    colors = CheckboxDefaults.colors(
                                        checkedColor = Amber500,
                                        checkmarkColor = Slate950,
                                        uncheckedColor = Slate700
                                    )
                                )

                                val diaFormateado = remember(diaIso) {
                                    try {
                                        val d = LocalDate.parse(diaIso)
                                        val diaSem = d.dayOfWeek.getDisplayName(java.time.format.TextStyle.FULL, Locale("es", "PE")).replaceFirstChar { it.uppercase() }
                                        val mesNom = d.month.getDisplayName(java.time.format.TextStyle.FULL, Locale("es", "PE")).replaceFirstChar { it.uppercase() }
                                        "$diaSem, ${d.dayOfMonth} de $mesNom"
                                    } catch (e: Exception) {
                                        diaIso
                                    }
                                }

                                Spacer(modifier = Modifier.width(10.dp))

                                Column {
                                    Text(
                                        text = diaFormateado,
                                        fontSize = 14.5.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (isChecked) Amber400 else if (yaVendida) Slate400 else Color.White
                                    )
                                    Spacer(modifier = Modifier.height(2.dp))
                                    Text(
                                        text = "Fecha: $diaIso",
                                        fontSize = 11.5.sp,
                                        color = Slate400
                                    )
                                }
                            }

                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(
                                        if (isChecked) Amber500.copy(alpha = 0.2f)
                                        else if (yaVendida) Emerald500.copy(alpha = 0.2f)
                                        else Slate800
                                    )
                                    .border(
                                        1.dp,
                                        if (isChecked) Amber500.copy(alpha = 0.5f)
                                        else if (yaVendida) Emerald500.copy(alpha = 0.6f)
                                        else Color.Transparent,
                                        RoundedCornerShape(8.dp)
                                    )
                                    .padding(horizontal = 10.dp, vertical = 5.dp)
                            ) {
                                Text(
                                    text = if (isChecked) "SELECCIONADO" else if (yaVendida) "VENDIDO (VD)" else "DISPONIBLE",
                                    fontSize = 10.5.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (isChecked) Amber400 else if (yaVendida) Emerald500 else Slate300
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
