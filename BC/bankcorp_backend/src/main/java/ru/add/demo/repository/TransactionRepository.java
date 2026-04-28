package ru.add.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.add.demo.model.Transaction;
import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    // Автоматически сгенерирует SQL-запрос для поиска транзакций пользователя с сортировкой по дате
    List<Transaction> findByUserIdOrderByDateDesc(Long userId);
}