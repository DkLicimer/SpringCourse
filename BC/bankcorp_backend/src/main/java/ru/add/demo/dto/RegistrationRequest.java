package ru.add.demo.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDate;

@Data
public class RegistrationRequest {
    @NotBlank(message = "Фамилия обязательна")
    private String lastName;

    @NotBlank(message = "Имя обязательно")
    private String firstName;

    private String middleName;

    @NotNull(message = "Дата рождения обязательна")
    @Past(message = "Дата рождения должна быть в прошлом")
    private LocalDate birthDate;

    @Pattern(regexp = "^\\+?[0-9]{10,15}$", message = "Неверный формат телефона")
    private String phone;

    @Pattern(regexp = "^\\d{4} \\d{6}$", message = "Паспорт должен быть в формате '1234 567890'")
    private String passportSeriesNumber;

    @NotNull(message = "Дата выдачи паспорта обязательна")
    private LocalDate passportIssueDate;

    @NotBlank(message = "Кем выдан обязательно")
    private String passportIssuedBy;

    @NotBlank(message = "Адрес регистрации обязателен")
    private String registrationAddress;
}