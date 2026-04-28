package ru.add.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class StatDTO {
    private String icon;
    private String label;
    private String value;
    private String change;
    private boolean positive;
}