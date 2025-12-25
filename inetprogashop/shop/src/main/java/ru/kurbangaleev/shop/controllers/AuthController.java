package ru.kurbangaleev.shop.controllers;

import ru.kurbangaleev.shop.config.JwtCore;
import ru.kurbangaleev.shop.dto.JwtResponse;
import ru.kurbangaleev.shop.dto.LoginRequest;
import ru.kurbangaleev.shop.dto.RegisterRequest;
import ru.kurbangaleev.shop.entities.User;
import ru.kurbangaleev.shop.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtCore jwtCore;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body("Ошибка: Пользователь уже существует");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole("ROLE_USER");
        userRepository.save(user);

        return ResponseEntity.ok("Пользователь успешно зарегистрирован");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        if (passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            String token = jwtCore.generateToken(user.getUsername(), user.getRole());

            return ResponseEntity.ok(new JwtResponse(
                    token,
                    user.getUsername(),
                    user.getRole()
            ));
        }

        return ResponseEntity.status(401).body("Неверный пароль");
    }
}