package ru.kurbangaleev.zabgu_space.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;

@Getter
@Setter
@AllArgsConstructor // Удобный конструктор для всех полей
public class ScheduleItemResponse {
    private String eventName;
    private OffsetDateTime startTime;
    private OffsetDateTime endTime;
}