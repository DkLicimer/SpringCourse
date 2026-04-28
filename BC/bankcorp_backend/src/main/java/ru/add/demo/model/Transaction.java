package ru.add.demo.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "transactions")
public class Transaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String category; // Например: "Доход" или "Расход"
    private LocalDate date;
    private BigDecimal amount;

    @Column(name = "is_positive")
    private boolean isPositive;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
}