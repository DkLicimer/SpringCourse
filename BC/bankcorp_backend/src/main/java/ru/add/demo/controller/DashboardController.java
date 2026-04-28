package ru.add.demo.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import ru.add.demo.dto.NewTransactionDTO;
import ru.add.demo.dto.StatDTO;
import ru.add.demo.dto.TransactionDTO;
import ru.add.demo.model.User;
import ru.add.demo.service.DashboardService;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "http://localhost:3000") // Разрешаем запросы от нашего React-фронтенда
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/{userId}/stats")
    public List<StatDTO> getStats(@PathVariable Long userId) {
        return dashboardService.getUserStats(userId);
    }

    @GetMapping("/{userId}/transactions")
    public List<TransactionDTO> getTransactions(@PathVariable Long userId) {
        return dashboardService.getUserTransactions(userId);
    }

    @PostMapping("/{userId}/transactions")
    public void addTransaction(@PathVariable Long userId, @RequestBody NewTransactionDTO dto) {
        dashboardService.addTransaction(userId, dto);
    }

    @GetMapping("/clients")
    public List<User> getClients() {
        return dashboardService.getAllClients();
    }
}