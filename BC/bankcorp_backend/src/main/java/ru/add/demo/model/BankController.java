package ru.add.demo.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import ru.add.demo.dto.RegistrationRequest;
import ru.add.demo.model.BankCard;
import ru.add.demo.model.Contract;
import ru.add.demo.service.ProductLifecycleService;
import ru.add.demo.service.RegistrationService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bank")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
public class BankController {

    private final RegistrationService registrationService;
    private final ProductLifecycleService productLifecycleService;

    // 1. Регистрация клиента (KYC)
    @PostMapping(value = "/clients/register", consumes = {"multipart/form-data"})
    public ResponseEntity<?> registerClient(
            @Valid @ModelAttribute RegistrationRequest request,
            @RequestParam("documentPhoto") MultipartFile file) {
        try {
            return ResponseEntity.ok(registrationService.registerClient(request, file));
        } catch (IllegalArgumentException e) {
            // Ошибки бизнес-логики (например, возраст < 14 или дубликат)
            return ResponseEntity.badRequest().body(Map.of("general", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("general", "Внутренняя ошибка сервера: " + e.getMessage()));
        }
    }

    // Обработчик ошибок валидации DTO (@Valid)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        return ResponseEntity.badRequest().body(errors);
    }

    // 2. Инициация открытия продукта
    @PostMapping("/products/{userId}/init")
    public Contract initProduct(@PathVariable Long userId, @RequestParam String productType) {
        return productLifecycleService.generateContract(userId, productType);
    }

    // 3. Подписание и выпуск карты
    @PostMapping("/products/sign/{contractId}")
    public BankCard signAndIssue(@PathVariable Long contractId, @RequestParam String secretWord) {
        return productLifecycleService.signContractAndIssueCard(contractId, secretWord);
    }

    // 4. Получить карты клиента
    @GetMapping("/products/{userId}/cards")
    public List<BankCard> getCards(@PathVariable Long userId) {
        return productLifecycleService.getClientCards(userId);
    }
}