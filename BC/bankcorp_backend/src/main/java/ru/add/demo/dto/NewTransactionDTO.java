package ru.add.demo.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class NewTransactionDTO {
    private String name;
    private String category;
    private BigDecimal amount;
    private boolean positive;
}