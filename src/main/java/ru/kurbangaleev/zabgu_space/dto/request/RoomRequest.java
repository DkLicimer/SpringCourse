package ru.kurbangaleev.zabgu_space.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RoomRequest {

    @NotBlank(message = "Название не может быть пустым")
    @Size(min = 5, max = 255, message = "Название должно содержать от 5 до 255 символов")
    private String name;

    @NotBlank(message = "Адрес не может быть пустым")
    @Size(min = 10, max = 255, message = "Адрес должен содержать от 10 до 255 символов")
    private String address;

    @NotBlank(message = "Описание вместимости не может быть пустым")
    private String capacity;

    @NotBlank(message = "Путь к изображению не может быть пустым")
    private String imagePath;
}