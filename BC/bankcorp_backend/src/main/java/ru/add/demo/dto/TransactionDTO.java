package ru.add.demo.dto;

import lombok.Data;

@Data
public class TransactionDTO {
    private String id;
    private String name;
    private String category;
    private String date;
    private String amount;
    private boolean positive;
}