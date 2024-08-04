package ru.kurbangaleev.orderservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.math.BigDecimal;

@FeignClient("payment-service")
public interface PaymentServiceClient {

    @PostMapping("/api/payments")
    boolean processPayment(@RequestParam Long id, @RequestParam BigDecimal amount);
}
