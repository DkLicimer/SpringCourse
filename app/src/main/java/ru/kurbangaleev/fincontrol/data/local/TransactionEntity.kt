package ru.kurbangaleev.fincontrol.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "transactions")
data class TransactionEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Int = 0,
    val amount: Double,           // Сумма
    val category: String,         // Название категории (Еда, Такси...)
    val date: Long,               // Дата в миллисекундах
    val isExpense: Boolean,       // true = Расход, false = Доход
    val note: String = ""         // Комментарий (необязательно)
)