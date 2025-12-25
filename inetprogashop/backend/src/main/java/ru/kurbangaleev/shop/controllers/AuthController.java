package ru.kurbangaleev.shop.controllers;

import ru.kurbangaleev.shop.config.JwtCore;
import ru.kurbangaleev.shop.entities.User;
import ru.kurbangaleev.shop.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtCore jwtCore;

    @PostMapping("/register")
    public String register(@RequestBody User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setRole("ROLE_USER"); // По умолчанию все пользователи
        userRepository.save(user);
        return "User registered";
    }

    @PostMapping("/login")
    public Map<String, String> login(@RequestBody User user) {
        User u = userRepository.findByUsername(user.getUsername()).orElseThrow();
        if (passwordEncoder.matches(user.getPassword(), u.getPassword())) {
            String token = jwtCore.generateToken(u.getUsername());
            return Map.of("token", token, "username", u.getUsername(), "role", u.getRole());
        }
        throw new RuntimeException("Invalid password");
    }
}