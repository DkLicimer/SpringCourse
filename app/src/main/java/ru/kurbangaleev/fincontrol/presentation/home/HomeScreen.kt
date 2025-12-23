package ru.kurbangaleev.fincontrol.presentation.home

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Info
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ru.kurbangaleev.fincontrol.data.local.TransactionEntity
import java.text.SimpleDateFormat
import java.util.*

// --- НАШИ ЦВЕТА (как на экране входа) ---
val PrimaryGold = Color(0xFFEEC069) // Приятный золотой/песочный
val DarkText = Color(0xFF2D2D2D)    // Темно-серый для текста
val LightBg = Color(0xFFFAFAFA)     // Чуть-чуть сероватый фон (почти белый)
val ExpenseColor = Color(0xFFE53935) // Красный
val IncomeColor = Color(0xFF43A047)  // Зеленый

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(viewModel: HomeViewModel) {
    val transactions by viewModel.transactions.collectAsState()
    val income by viewModel.totalIncome.collectAsState()
    val expense by viewModel.totalExpense.collectAsState()
    val usdRate by viewModel.usdRate.collectAsState()

    var showDialog by remember { mutableStateOf(false) }

    if (showDialog) {
        AddTransactionDialog(
            onDismiss = { showDialog = false },
            onConfirm = { transaction ->
                viewModel.addTransaction(transaction)
                showDialog = false
            }
        )
    }

    Scaffold(
        containerColor = Color.White, // Белый фон всего экрана
        topBar = {
            CenterAlignedTopAppBar(
                title = {
                    Text(
                        "FinControl",
                        fontWeight = FontWeight.Bold,
                        color = PrimaryGold // Золотой заголовок
                    )
                },
                colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
                    containerColor = Color.White
                )
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showDialog = true },
                containerColor = PrimaryGold, // Золотая кнопка
                contentColor = Color.White
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add")
            }
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .padding(paddingValues)
                .fillMaxSize()
                .padding(horizontal = 16.dp)
        ) {
            // Карточка курса валют (светло-голубая, мягкая)
            if (usdRate != null) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFE1F5FE)),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Default.Info, contentDescription = null, tint = Color(0xFF0288D1))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Курс ЦБ: 1 $ = ${usdRate} ₽",
                            style = MaterialTheme.typography.labelLarge,
                            color = Color(0xFF0277BD),
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }

            // Карточка баланса
            BalanceCard(income = income ?: 0.0, expense = expense ?: 0.0)

            Spacer(modifier = Modifier.height(20.dp))

            Text(
                "История операций",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = DarkText
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Список транзакций
            if (transactions.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("Список пуст. Нажмите +, чтобы добавить.", color = Color.Gray)
                }
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                    contentPadding = PaddingValues(bottom = 80.dp)
                ) {
                    items(transactions) { transaction ->
                        TransactionItem(
                            transaction = transaction,
                            onDeleteClick = { viewModel.deleteTransaction(transaction) }
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun BalanceCard(income: Double, expense: Double) {
    val balance = income - expense

    // Красивый градиент для карточки (как на банковских картах)
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        colors = CardDefaults.cardColors(containerColor = PrimaryGold)
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Text(
                "Текущий баланс",
                style = MaterialTheme.typography.labelMedium,
                color = Color.White.copy(alpha = 0.8f)
            )
            Text(
                text = "%.2f ₽".format(balance),
                style = MaterialTheme.typography.headlineLarge,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )

            Spacer(modifier = Modifier.height(20.dp))

            // Блок доходов и расходов внутри карточки
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color.White.copy(alpha = 0.2f), RoundedCornerShape(12.dp))
                    .padding(12.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text("Доходы", color = Color.White.copy(alpha = 0.9f), fontSize = 12.sp)
                    Text("+%.0f".format(income), color = Color.White, fontWeight = FontWeight.Bold)
                }
                Box(
                    modifier = Modifier
                        .width(1.dp)
                        .height(30.dp)
                        .background(Color.White.copy(alpha = 0.3f))
                )
                Column(horizontalAlignment = Alignment.End) {
                    Text("Расходы", color = Color.White.copy(alpha = 0.9f), fontSize = 12.sp)
                    Text("-%.0f".format(expense), color = Color.White, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
fun TransactionItem(transaction: TransactionEntity, onDeleteClick: () -> Unit) {
    val dateFormatted = SimpleDateFormat("dd MMM", Locale.getDefault()).format(Date(transaction.date))

    Card(
        colors = CardDefaults.cardColors(containerColor = Color.White), // Белая карточка
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        shape = RoundedCornerShape(16.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Иконка категории
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .background(
                        if (transaction.isExpense) Color(0xFFFFEBEE) else Color(0xFFE8F5E9),
                        CircleShape
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = transaction.category.take(1).uppercase(),
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp,
                    color = if (transaction.isExpense) ExpenseColor else IncomeColor
                )
            }

            Spacer(modifier = Modifier.width(16.dp))

            // Название и дата
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = transaction.category,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = DarkText
                )
                Text(
                    text = dateFormatted,
                    style = MaterialTheme.typography.bodySmall,
                    color = Color.Gray
                )
            }

            // Сумма
            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = (if (transaction.isExpense) "-" else "+") + "%.0f ₽".format(transaction.amount),
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp,
                    color = if (transaction.isExpense) ExpenseColor else IncomeColor
                )

                // Кнопка удаления (маленькая корзина)
                IconButton(
                    onClick = onDeleteClick,
                    modifier = Modifier.size(20.dp).padding(top = 4.dp)
                ) {
                    Icon(Icons.Default.Delete, contentDescription = "Delete", tint = Color.LightGray)
                }
            }
        }
    }
}