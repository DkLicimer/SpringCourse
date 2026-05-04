package ru.add.demo.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Расширенные данные
    private String lastName;
    private String firstName;
    private String middleName;
    private LocalDate birthDate;

    @Column(unique = true)
    private String phone;

    @Column(unique = true)
    private String passportSeriesNumber;
    private LocalDate passportIssueDate;
    private String passportIssuedBy;
    private String registrationAddress;

    private String photoUrl; // Путь к сохраненному скану/фото
    private boolean isVerified; // Прошел ли KYC

    // Оставляем для совместимости с дашбордом
    private BigDecimal balance = BigDecimal.ZERO;
    private BigDecimal savings = BigDecimal.ZERO;

    public String getFullName() {
        return lastName + " " + firstName + (middleName != null ? " " + middleName : "");
    }
}