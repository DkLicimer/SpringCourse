package ru.add.demo.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.add.demo.dto.NewTransactionDTO;
import ru.add.demo.dto.StatDTO;
import ru.add.demo.dto.TransactionDTO;
import ru.add.demo.model.Transaction;
import ru.add.demo.model.User;
import ru.add.demo.repository.TransactionRepository;
import ru.add.demo.repository.UserRepository;

import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.time.LocalDate;
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
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        List<Transaction> transactions = transactionRepository.findByUserIdOrderByDateDesc(userId);

        BigDecimal income = transactions.stream()
                .filter(Transaction::isPositive)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal expense = transactions.stream()
                .filter(t -> !t.isPositive())
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return List.of(
                new StatDTO("bi-wallet2", "Баланс", formatMoney(user.getBalance()), "Актуально", true),
                new StatDTO("bi-arrow-down-circle", "Доходы", formatMoney(income), "Всего", true),
                new StatDTO("bi-arrow-up-circle", "Расходы", formatMoney(expense), "Всего", false),
                new StatDTO("bi-piggy-bank", "Накопления", formatMoney(user.getSavings()), "Копилка", true)
        );
    }

    public List<TransactionDTO> getUserTransactions(Long userId) {
        List<Transaction> transactions = transactionRepository.findByUserIdOrderByDateDesc(userId);
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd.MM.yyyy");

        return transactions.stream().map(t -> {
            TransactionDTO dto = new TransactionDTO();
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

    private String formatMoney(BigDecimal amount) {
        DecimalFormatSymbols symbols = new DecimalFormatSymbols(Locale.getDefault());
        symbols.setGroupingSeparator(' ');
        DecimalFormat df = new DecimalFormat("#,### ₽", symbols);
        return df.format(amount);
    }

    @Transactional
    public void addTransaction(Long userId, NewTransactionDTO dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        if (dto.isPositive()) {
            user.setBalance(user.getBalance().add(dto.getAmount()));
        } else {
            user.setBalance(user.getBalance().subtract(dto.getAmount()));
        }
        userRepository.save(user);

        Transaction t = new Transaction();
        t.setUser(user);
        t.setName(dto.getName());
        t.setCategory(dto.getCategory());
        t.setAmount(dto.getAmount());
        t.setPositive(dto.isPositive());
        t.setDate(LocalDate.now());

        transactionRepository.save(t);
    }

    public List<User> getAllClients() {
        return userRepository.findAll();
    }

    @Transactional
    public void createClient(String fullName) {
        User user = new User();
        user.setFullName(fullName);
        user.setBalance(BigDecimal.ZERO);
        user.setSavings(BigDecimal.ZERO);
        userRepository.save(user);
    }
}