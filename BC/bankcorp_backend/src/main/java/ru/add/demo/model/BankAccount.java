package ru.add.demo.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "bank_accounts")
public class BankAccount {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @Column(unique = true)
    private String accountNumber; // 20-значный номер счета (например, 40817...)

    private String currency; // "RUB", "USD"
    private BigDecimal balance = BigDecimal.ZERO;
    private LocalDate openingDate;
    private boolean isActive = true;
}