package com.example.neshkola.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.example.neshkola.data.repository.QuestionRepository
import com.example.neshkola.model.Category
import com.example.neshkola.model.Difficulty
import com.example.neshkola.ui.navigation.Screen

@Composable
fun QuizScreen(
    navController: NavController,
    category: String,
    difficulty: String
) {
    val questions = remember {
        QuestionRepository.getQuestions(
            Category.valueOf(category),
            Difficulty.valueOf(difficulty)
        )
    }

    var index by remember { mutableStateOf(0) }
    var score by remember { mutableStateOf(0) }

    if (index >= questions.size) {
        LaunchedEffect(Unit) {
            navController.navigate(
                Screen.Result.createRoute(score, questions.size)
            ) {
                popUpTo(Screen.Main.route)
            }
        }
        return
    }

    val question = questions[index]

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.SpaceBetween
    ) {

        Text(
            text = "Вопрос ${index + 1} из ${questions.size}",
            style = MaterialTheme.typography.titleMedium
        )

        Text(
            text = question.text,
            style = MaterialTheme.typography.titleLarge
        )

        Column {
            question.options.forEachIndexed { i, option ->
                Button(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp),
                    onClick = {
                        if (i == question.correctIndex) score++
                        index++
                    }
                ) {
                    Text(option)
                }
            }
        }
    }
}
