package ru.add.demo.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "cards")
public class BankCard {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    private String cardNumber;
    private String cardType;
    private LocalDate expiryDate;
    private String secretWord;
    private BigDecimal cardBalance = BigDecimal.ZERO;
    private boolean isActive;
}