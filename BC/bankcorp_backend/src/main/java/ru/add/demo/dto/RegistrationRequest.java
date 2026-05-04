package ru.add.demo.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDate;

@Data
public class RegistrationRequest {
    @NotBlank(message = "Фамилия обязательна")
    @Pattern(regexp = "^[А-Яа-яЁё\\-]+$", message = "Фамилия должна содержать только кириллицу")
    private String lastName;

    @NotBlank(message = "Имя обязательно")
    @Pattern(regexp = "^[А-Яа-яЁё\\-]+$", message = "Имя должно содержать только кириллицу")
    private String firstName;

    @Pattern(regexp = "^[А-Яа-яЁё\\-]*$", message = "Отчество должно содержать только кириллицу")
    private String middleName;

    @NotNull(message = "Дата рождения обязательна")
    @Past(message = "Дата рождения должна быть в прошлом")
    private LocalDate birthDate;

    @NotBlank(message = "Телефон обязателен")
    @Pattern(regexp = "^\\+7\\d{10}$", message = "Телефон должен быть в формате +7XXXXXXXXXX")
    private String phone;

    @NotBlank(message = "Серия и номер паспорта обязательны")
    @Pattern(regexp = "^\\d{4} \\d{6}$", message = "Паспорт должен быть в формате '1234 567890'")
    private String passportSeriesNumber;

    @NotNull(message = "Дата выдачи паспорта обязательна")
    @PastOrPresent(message = "Дата выдачи паспорта не может быть в будущем")
    private LocalDate passportIssueDate;

    @NotBlank(message = "Кем выдан обязательно")
    private String passportIssuedBy;

    @NotBlank(message = "Код подразделения обязателен")
    @Pattern(regexp = "^\\d{3}-\\d{3}$", message = "Код подразделения должен быть в формате '123-456'")
    private String departmentCode;

    @NotBlank(message = "СНИЛС обязателен")
    @Pattern(regexp = "^\\d{3}-\\d{3}-\\d{3} \\d{2}$", message = "СНИЛС должен быть в формате '123-456-789 00'")
    private String snils;

    @NotBlank(message = "Адрес регистрации обязателен")
    private String registrationAddress;
}