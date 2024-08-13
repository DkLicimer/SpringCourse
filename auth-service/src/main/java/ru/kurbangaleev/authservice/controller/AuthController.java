package ru.kurbangaleev.authservice.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.kurbangaleev.authservice.model.User;
import ru.kurbangaleev.authservice.service.AuthService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        User registeredUser = authService.register(user);
        return ResponseEntity.ok(registeredUser);
    }

    @PostMapping("/authenticate")
    public ResponseEntity<?> authenticate(@RequestBody User user) {
        String token = authService.authenticate(user.getUsername(), user.getPassword());
        return ResponseEntity.ok(token);
    }
}
