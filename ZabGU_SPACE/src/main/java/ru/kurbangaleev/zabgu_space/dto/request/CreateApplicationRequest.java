package ru.kurbangaleev.zabgu_space.dto.request;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;

@Getter
@Setter
public class CreateApplicationRequest {

    @NotNull(message = "ID помещения не может быть пустым")
    private Long roomId;

    @Future(message = "Время начала должно быть в будущем")
    @NotNull(message = "Время начала не может быть пустым")
    private OffsetDateTime startTime;

    @Future(message = "Время окончания должно быть в будущем")
    @NotNull(message = "Время окончания не может быть пустым")
    private OffsetDateTime endTime;

    @NotBlank(message = "Название мероприятия не может быть пустым")
    @Size(max = 255, message = "Название мероприятия слишком длинное")
    private String eventName;

    private boolean soundEngineerRequired;

    @NotBlank(message = "ФИО не может быть пустым")
    private String applicantFullName;

    @NotBlank(message = "Должность не может быть пустой")
    private String applicantPosition;

    @NotBlank(message = "Email не может быть пустым")
    @Email(message = "Некорректный формат Email")
    private String applicantEmail;

    @NotBlank(message = "Телефон не может быть пустым")
    private String applicantPhone;
}