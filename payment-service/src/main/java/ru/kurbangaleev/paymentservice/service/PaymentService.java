package ru.kurbangaleev.paymentservice.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import ru.kurbangaleev.paymentservice.dto.PaymentDto;
import ru.kurbangaleev.paymentservice.model.Payment;
import ru.kurbangaleev.paymentservice.repository.PaymentRepository;

import java.time.LocalDateTime;

@Service
@Slf4j
public class PaymentService {
    private PaymentRepository paymentRepository;

    public Payment processPayment (PaymentDto paymentDto) {
        Payment payment = new Payment();
        payment.setOrderId(paymentDto.getOrderId());
        payment.setAmount(paymentDto.getAmount());
        payment.setStatus("PROCESSING");
        payment.setCreateAt(LocalDateTime.now());

        // Здесь должна быть описана логика обработки платежа через платежный шлюз
        // В данном мы имитируем успешный платеж

        payment.setStatus("COMPLETED");
        return paymentRepository.save(payment);
    }

    public Payment getPaymentByOrderId(String orderId) {
        return paymentRepository.findByOrderId(orderId);
    }
}
