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
    @Size(min = 3, max = 255, message = "Название мероприятия должно содержать от 3 до 255 символов")
    private String eventName;

    private boolean soundEngineerRequired;

    @NotBlank(message = "ФИО не может быть пустым")
    @Size(min = 5, max = 255, message = "ФИО должно содержать от 5 до 255 символов")
    private String applicantFullName;

    @NotBlank(message = "Должность не может быть пустой")
    @Size(min = 3, max = 255, message = "Должность должна содержать от 3 до 255 символов")
    private String applicantPosition;

    @NotBlank(message = "Email не может быть пустым")
    @Email(message = "Некорректный формат Email")
    private String applicantEmail;

    @NotBlank(message = "Телефон не может быть пустым")
    // Добавляем проверку формата российского номера телефона
    @Pattern(regexp = "^(\\+7|8)[\\s(]?\\d{3}[)\\s]?\\d{3}[\\s-]?\\d{2}[\\s-]?\\d{2}$", message = "Некорректный формат номера телефона")
    private String applicantPhone;
}