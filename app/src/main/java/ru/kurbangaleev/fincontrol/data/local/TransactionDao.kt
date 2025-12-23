package ru.kurbangaleev.fincontrol.data.local

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface TransactionDao {

    // Получить все записи (сортируем: новые сверху)
    @Query("SELECT * FROM transactions ORDER BY date DESC")
    fun getAllTransactions(): Flow<List<TransactionEntity>>

    // Добавить запись
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTransaction(transaction: TransactionEntity)

    // Удалить запись
    @Delete
    suspend fun deleteTransaction(transaction: TransactionEntity)

    // Получить общую сумму доходов
    @Query("SELECT SUM(amount) FROM transactions WHERE isExpense = 0")
    fun getTotalIncome(): Flow<Double?>

    // Получить общую сумму расходов
    @Query("SELECT SUM(amount) FROM transactions WHERE isExpense = 1")
    fun getTotalExpense(): Flow<Double?>
}