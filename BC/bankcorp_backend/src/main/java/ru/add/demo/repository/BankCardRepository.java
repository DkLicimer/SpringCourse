package ru.add.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.add.demo.model.BankCard;

import java.util.List;

public interface BankCardRepository extends JpaRepository<BankCard, Long> {
    List<BankCard> findByUserId(Long userId);
}
