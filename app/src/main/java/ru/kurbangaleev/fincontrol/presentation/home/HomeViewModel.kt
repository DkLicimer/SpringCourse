package ru.kurbangaleev.fincontrol.presentation.home

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import ru.kurbangaleev.fincontrol.data.local.TransactionEntity
import ru.kurbangaleev.fincontrol.data.remote.RetrofitClient
import ru.kurbangaleev.fincontrol.domain.repository.TransactionRepository

class HomeViewModel(private val repository: TransactionRepository) : ViewModel() {

    val transactions = repository.getAllTransactions()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val totalIncome = repository.getTotalIncome()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0.0)

    val totalExpense = repository.getTotalExpense()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0.0)

    // --- НОВОЕ: Курс валют ---
    private val _usdRate = MutableStateFlow<Double?>(null)
    val usdRate = _usdRate.asStateFlow()

    init {
        loadCurrency()
    }

    private fun loadCurrency() {
        viewModelScope.launch {
            try {
                // Было: .getUsdRate() (возможно с параметрами)
                // Стало: просто вызываем без параметров
                val response = RetrofitClient.api.getUsdRate()

                // Достаем "RUB" из карты курсов
                _usdRate.value = response.rates["RUB"]
            } catch (e: Exception) {
                // ... (тут лог ошибки, оставь как есть)
            }
        }
    }
    // -------------------------

    fun deleteTransaction(transaction: TransactionEntity) {
        viewModelScope.launch { repository.deleteTransaction(transaction) }
    }

    fun addTransaction(transaction: TransactionEntity) {
        viewModelScope.launch { repository.insertTransaction(transaction) }
    }
}

// Factory оставляем как было...
class HomeViewModelFactory(private val repository: TransactionRepository) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(HomeViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return HomeViewModel(repository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}