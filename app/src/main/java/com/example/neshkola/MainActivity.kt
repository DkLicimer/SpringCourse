package com.example.neshkola

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.example.neshkola.ui.navigation.AppNavGraph
import com.example.neshkola.ui.theme.NeShkolaTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            NeShkolaTheme {
                AppNavGraph()
            }
        }
    }
}
