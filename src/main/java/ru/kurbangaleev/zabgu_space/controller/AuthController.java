package ru.kurbangaleev.zabgu_space.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.kurbangaleev.zabgu_space.dto.request.LoginRequest;
import ru.kurbangaleev.zabgu_space.dto.response.JwtResponse;
import ru.kurbangaleev.zabgu_space.security.jwt.JwtTokenProvider;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;

    public AuthController(AuthenticationManager authenticationManager, JwtTokenProvider tokenProvider) {
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {

        // 1. Создаем объект аутентификации на основе логина и пароля
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getLogin(),
                        loginRequest.getPassword()
                )
        );

        // 2. Если аутентификация прошла успешно, Spring Security сохраняет ее в SecurityContext
        SecurityContextHolder.getContext().setAuthentication(authentication);

        // 3. Генерируем JWT токен
        String jwt = tokenProvider.generateToken(authentication);

        // 4. Возвращаем токен клиенту
        return ResponseEntity.ok(new JwtResponse(jwt));
    }
}