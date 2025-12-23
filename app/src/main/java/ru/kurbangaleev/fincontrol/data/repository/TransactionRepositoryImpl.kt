package ru.kurbangaleev.fincontrol.data.repository

import kotlinx.coroutines.flow.Flow
import ru.kurbangaleev.fincontrol.data.local.TransactionDao
import ru.kurbangaleev.fincontrol.data.local.TransactionEntity
import ru.kurbangaleev.fincontrol.domain.repository.TransactionRepository

class TransactionRepositoryImpl(private val dao: TransactionDao) : TransactionRepository {

    override fun getAllTransactions(): Flow<List<TransactionEntity>> {
        return dao.getAllTransactions()
    }

    override fun getTotalIncome(): Flow<Double?> {
        return dao.getTotalIncome()
    }

    override fun getTotalExpense(): Flow<Double?> {
        return dao.getTotalExpense()
    }

    override suspend fun insertTransaction(transaction: TransactionEntity) {
        dao.insertTransaction(transaction)
    }

    override suspend fun deleteTransaction(transaction: TransactionEntity) {
        dao.deleteTransaction(transaction)
    }
}