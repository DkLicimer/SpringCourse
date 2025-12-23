package ru.kurbangaleev.fincontrol

import android.app.Application
import androidx.room.Room
import ru.kurbangaleev.fincontrol.data.local.AppDatabase
import ru.kurbangaleev.fincontrol.data.repository.TransactionRepositoryImpl
import ru.kurbangaleev.fincontrol.domain.repository.TransactionRepository

class FinControlApp : Application() {

    // Ленивая инициализация БД (создастся только когда понадобится)
    private val database by lazy {
        Room.databaseBuilder(
            applicationContext,
            AppDatabase::class.java,
            "fincontrol_db"
        ).build()
    }

    // Ленивая инициализация репозитория (Singleton)
    val repository: TransactionRepository by lazy {
        TransactionRepositoryImpl(database.transactionDao())
    }
}