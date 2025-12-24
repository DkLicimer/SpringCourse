package com.example.neshkola.model

data class Question(
    val id: Int,
    val category: Category,
    val difficulty: Difficulty,
    val text: String,
    val options: List<String>,
    val correctIndex: Int
)
