package ru.kurbangaleev.fincontrol.presentation.home

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.draw.clip
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ru.kurbangaleev.fincontrol.data.local.TransactionEntity

@Composable
fun AddTransactionDialog(
    onDismiss: () -> Unit,
    onConfirm: (TransactionEntity) -> Unit
) {
    var title by remember { mutableStateOf("") }
    var amount by remember { mutableStateOf("") }
    var isExpense by remember { mutableStateOf(true) } // По умолчанию - Расход
    var isError by remember { mutableStateOf(false) }

    // Используем те же цвета, что и на главном экране
    val PrimaryGold = Color(0xFFEEC069)
    val DarkText = Color(0xFF2D2D2D)
    val ExpenseColor = Color(0xFFE53935)
    val IncomeColor = Color(0xFF43A047)

    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = Color.White, // Белый фон диалога
        titleContentColor = DarkText,
        textContentColor = DarkText,
        shape = RoundedCornerShape(28.dp), // Сильное скругление углов
        title = {
            Text(
                text = "Новая запись",
                fontWeight = FontWeight.Bold,
                fontSize = 22.sp
            )
        },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Поле ввода названия
                OutlinedTextField(
                    value = title,
                    onValueChange = {
                        title = it
                        isError = false
                    },
                    label = { Text("Название (например, Кофе)") },
                    placeholder = { Text("Введите название") },
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp),
                    keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Sentences),
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = PrimaryGold,        // Золотая рамка при фокусе
                        focusedLabelColor = PrimaryGold,         // Золотой текст лейбла
                        cursorColor = PrimaryGold,               // Золотой курсор
                        unfocusedBorderColor = Color.LightGray
                    )
                )

                // Поле ввода суммы
                OutlinedTextField(
                    value = amount,
                    onValueChange = {
                        if (it.all { char -> char.isDigit() || char == '.' }) {
                            amount = it
                            isError = false
                        }
                    },
                    label = { Text("Сумма (₽)") },
                    placeholder = { Text("0") },
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    isError = isError,
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = PrimaryGold,
                        focusedLabelColor = PrimaryGold,
                        cursorColor = PrimaryGold,
                        unfocusedBorderColor = Color.LightGray,
                        errorBorderColor = ExpenseColor
                    )
                )

                if (isError) {
                    Text(
                        text = "Пожалуйста, введите сумму и название",
                        color = ExpenseColor,
                        style = MaterialTheme.typography.bodySmall,
                        modifier = Modifier.padding(start = 4.dp)
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                // Переключатель типа (Радиокнопки)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    // Кнопка Расход
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .clickable { isExpense = true }
                            .padding(8.dp)
                    ) {
                        RadioButton(
                            selected = isExpense,
                            onClick = { isExpense = true },
                            colors = RadioButtonDefaults.colors(selectedColor = ExpenseColor)
                        )
                        Text(
                            text = "Расход",
                            color = if(isExpense) ExpenseColor else Color.Gray,
                            fontWeight = if(isExpense) FontWeight.Bold else FontWeight.Normal
                        )
                    }

                    // Кнопка Доход
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .clickable { isExpense = false }
                            .padding(8.dp)
                    ) {
                        RadioButton(
                            selected = !isExpense,
                            onClick = { isExpense = false },
                            colors = RadioButtonDefaults.colors(selectedColor = IncomeColor)
                        )
                        Text(
                            text = "Доход",
                            color = if(!isExpense) IncomeColor else Color.Gray,
                            fontWeight = if(!isExpense) FontWeight.Bold else FontWeight.Normal
                        )
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val sum = amount.toDoubleOrNull()
                    if (sum != null && sum > 0 && title.isNotBlank()) {
                        val transaction = TransactionEntity(
                            amount = sum,
                            category = title,
                            date = System.currentTimeMillis(),
                            isExpense = isExpense
                        )
                        onConfirm(transaction)
                    } else {
                        isError = true
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryGold), // Золотая кнопка
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.padding(bottom = 8.dp, end = 8.dp)
            ) {
                Text("Сохранить", color = Color.White, fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            TextButton(
                onClick = onDismiss,
                modifier = Modifier.padding(bottom = 8.dp)
            ) {
                Text("Отмена", color = Color.Gray)
            }
        }
    )
}