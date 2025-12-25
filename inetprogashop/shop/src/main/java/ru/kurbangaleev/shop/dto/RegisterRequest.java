package ru.kurbangaleev.shop.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank(message = "Логин не может быть пустым")
    private String username;

    @NotBlank(message = "Пароль не может быть пустым")
    @Size(min = 4, message = "Пароль должен быть минимум 4 символа")
    private String password;
}