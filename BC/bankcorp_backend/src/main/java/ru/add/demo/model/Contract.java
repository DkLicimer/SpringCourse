package ru.add.demo.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "contracts")
public class Contract {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    private String productType; // "DEBIT_CARD", "CREDIT_CARD"

    @Column(columnDefinition = "TEXT")
    private String contractText; // Сгенерированный текст договора

    private boolean isSigned;
    private LocalDateTime signedAt;
}