package ru.add.demo.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import ru.add.demo.dto.StatDTO;
import ru.add.demo.dto.TransactionDTO;
import ru.add.demo.model.Transaction;
import ru.add.demo.model.User;
import ru.add.demo.repository.TransactionRepository;
import ru.add.demo.repository.UserRepository;

import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;

    public List<StatDTO> getUserStats(Long userId) {
        // Ищем пользователя в БД, если нет - кидаем ошибку
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        // В реальном проекте доходы/расходы высчитываются динамически из транзакций
        // Для старта покажем реальные Баланс и Накопления из БД, остальное оставим заглушкой
        return List.of(
                new StatDTO("bi-wallet2", "Баланс", formatMoney(user.getBalance()), "+2.4%", true),
                new StatDTO("bi-arrow-down-circle", "Доходы", "38 200 ₽", "+5.1%", true),
                new StatDTO("bi-arrow-up-circle", "Расходы", "14 870 ₽", "-1.3%", false),
                new StatDTO("bi-piggy-bank", "Накопления", formatMoney(user.getSavings()), "+8.0%", true)
        );
    }

    public List<TransactionDTO> getUserTransactions(Long userId) {
        List<Transaction> transactions = transactionRepository.findByUserIdOrderByDateDesc(userId);
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd.MM.yyyy");

        return transactions.stream().map(t -> {
            TransactionDTO dto = new TransactionDTO();
            // Форматируем ID с нулями: 1 -> #00001
            dto.setId(String.format("#%05d", t.getId()));
            dto.setName(t.getName());
            dto.setCategory(t.getCategory());
            dto.setDate(t.getDate().format(dateFormatter));

            String sign = t.isPositive() ? "+" : "-";
            dto.setAmount(sign + formatMoney(t.getAmount()));
            dto.setPositive(t.isPositive());
            return dto;
        }).collect(Collectors.toList());
    }

    // Красивое форматирование денег: 124530 -> 124 530 ₽
    private String formatMoney(BigDecimal amount) {
        DecimalFormatSymbols symbols = new DecimalFormatSymbols(Locale.getDefault());
        symbols.setGroupingSeparator(' ');
        DecimalFormat df = new DecimalFormat("#,### ₽", symbols);
        return df.format(amount);
    }
}