package com.example.neshkola.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.compose.*
import com.example.neshkola.ui.screens.*

@Composable
fun AppNavGraph() {
    val navController = rememberNavController()

    NavHost(
        navController = navController,
        startDestination = Screen.Splash.route
    ) {
        composable(Screen.Splash.route) {
            SplashScreen(navController)
        }
        composable(Screen.Main.route) {
            MainScreen(navController)
        }
        composable(Screen.Category.route) {
            CategoryScreen(navController)
        }
        composable(Screen.Difficulty.route) { backStack ->
            val category = backStack.arguments?.getString("category")!!
            DifficultyScreen(navController, category)
        }
        composable(Screen.Quiz.route) { backStack ->
            val category = backStack.arguments?.getString("category")!!
            val difficulty = backStack.arguments?.getString("difficulty")!!
            QuizScreen(navController, category, difficulty)
        }
        composable(Screen.Result.route) { backStack ->
            val score = backStack.arguments?.getString("score")!!.toInt()
            val total = backStack.arguments?.getString("total")!!.toInt()
            ResultScreen(navController, score, total)
        }
    }
}
