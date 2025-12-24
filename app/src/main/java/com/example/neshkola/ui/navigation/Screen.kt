package com.example.neshkola.ui.navigation

sealed class Screen(val route: String) {

    object Splash : Screen("splash")
    object Main : Screen("main")
    object Category : Screen("category")
    object Difficulty : Screen("difficulty/{category}") {
        fun createRoute(category: String) = "difficulty/$category"
    }

    object Quiz : Screen("quiz/{category}/{difficulty}") {
        fun createRoute(category: String, difficulty: String) =
            "quiz/$category/$difficulty"
    }

    object Result : Screen("result/{score}/{total}") {
        fun createRoute(score: Int, total: Int) =
            "result/$score/$total"
    }
}
