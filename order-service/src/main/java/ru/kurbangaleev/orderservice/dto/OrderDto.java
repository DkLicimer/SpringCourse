package ru.kurbangaleev.orderservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderDto {
    private Long id;
    private Long userId;
    private List<OrderItemDto> items;
    private BigDecimal totalAmount;
    private String status;
    private LocalDateTime createdAt;
}
