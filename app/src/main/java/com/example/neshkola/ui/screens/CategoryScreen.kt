package com.example.neshkola.ui.screens

import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.foundation.layout.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.example.neshkola.model.Category
import com.example.neshkola.ui.navigation.Screen

@Composable
fun CategoryScreen(nav: NavController) {
    Column(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Category.values().forEach {
            Button(
                modifier = Modifier.padding(8.dp),
                onClick = { nav.navigate("difficulty/${it.name}") }
            ) {
                Text(it.title)
            }
        }
    }
}
