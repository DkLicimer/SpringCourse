package ru.kurbangaleev.paymentservice.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.kurbangaleev.paymentservice.dto.PaymentDto;
import ru.kurbangaleev.paymentservice.model.Payment;
import ru.kurbangaleev.paymentservice.service.PaymentService;

@RestController
@RequestMapping("/api/payment")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @PostMapping
    public ResponseEntity<Payment> processPayment(@RequestBody PaymentDto paymentDto) {
        Payment payment = paymentService.processPayment(paymentDto);
        return ResponseEntity.ok(payment);
    }

    @GetMapping("{orderId}")
    public ResponseEntity<Payment> getPaymentByOrderId(@PathVariable String orderId) {
        Payment payment = paymentService.getPaymentByOrderId(orderId);
        if (payment != null) {
            return ResponseEntity.ok(payment);
        }
        return ResponseEntity.notFound().build();
    }
}
