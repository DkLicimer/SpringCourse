package ru.kurbangaleev.zabgu_space.dto.response;

import lombok.Builder;
import lombok.Getter;
import ru.kurbangaleev.zabgu_space.entity.ApplicationStatus;

import java.time.OffsetDateTime;

@Getter
@Builder // Используем Builder для удобного создания объекта
public class ApplicationDetailsResponse {
    private Long id;
    private String eventName;
    private ApplicationStatus status;
    private OffsetDateTime startTime;
    private OffsetDateTime endTime;
    private boolean soundEngineerRequired;
    private String applicantFullName;
    private String applicantPosition;
    private String applicantEmail;
    private String applicantPhone;
    private String rejectionReason;
    private OffsetDateTime createdAt;

    // Информация о помещении
    private Long roomId;
    private String roomName;
}