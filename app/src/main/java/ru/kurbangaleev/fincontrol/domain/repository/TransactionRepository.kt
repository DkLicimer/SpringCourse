package ru.kurbangaleev.fincontrol.domain.repository

import kotlinx.coroutines.flow.Flow
import ru.kurbangaleev.fincontrol.data.local.TransactionEntity

interface TransactionRepository {
    fun getAllTransactions(): Flow<List<TransactionEntity>>

    fun getTotalIncome(): Flow<Double?>

    fun getTotalExpense(): Flow<Double?>

    suspend fun insertTransaction(transaction: TransactionEntity)

    suspend fun deleteTransaction(transaction: TransactionEntity)
}