package ru.kurbangaleev.fincontrol.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import ru.kurbangaleev.fincontrol.data.local.TransactionEntity
import ru.kurbangaleev.fincontrol.data.local.TransactionDao

@Database(entities = [TransactionEntity::class], version = 1, exportSchema = false)
abstract class AppDatabase : RoomDatabase() {
    abstract fun transactionDao(): TransactionDao
}