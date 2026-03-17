package ru.kurbangaleev.zabgu_space;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordGenerator {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        // Укажи здесь пароль, который хочешь использовать
        String rawPassword = "7xnQtX1oWsDqe7o2";
        String encodedPassword = encoder.encode(rawPassword);

        System.out.println("Пароль: " + rawPassword);
        System.out.println("Хеш для вставки в БД: " + encodedPassword);
    }
}