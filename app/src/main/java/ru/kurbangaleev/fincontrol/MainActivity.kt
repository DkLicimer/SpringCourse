package ru.kurbangaleev.fincontrol

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.lifecycle.viewmodel.compose.viewModel
import ru.kurbangaleev.fincontrol.presentation.home.HomeScreen
import ru.kurbangaleev.fincontrol.presentation.home.HomeViewModel
import ru.kurbangaleev.fincontrol.presentation.home.HomeViewModelFactory
import ru.kurbangaleev.fincontrol.ui.theme.FinControlTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Получаем доступ к "Application" классу, где лежит наша База Данных
        val app = application as FinControlApp
        val repository = app.repository

        // Создаем фабрику для ViewModel
        val viewModelFactory = HomeViewModelFactory(repository)

        setContent {
            FinControlTheme {
                // Инициализируем ViewModel с помощью фабрики
                val viewModel: HomeViewModel = viewModel(factory = viewModelFactory)

                // Рисуем экран
                HomeScreen(viewModel = viewModel)
            }
        }
    }
}