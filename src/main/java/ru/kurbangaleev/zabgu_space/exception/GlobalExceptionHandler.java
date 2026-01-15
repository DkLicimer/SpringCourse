package ru.kurbangaleev.zabgu_space.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import ru.kurbangaleev.zabgu_space.dto.response.ErrorResponse;

import java.util.stream.Collectors;

@ControllerAdvice // Эта аннотация делает класс глобальным обработчиком исключений
public class GlobalExceptionHandler {

    // === ДОБАВЬТЕ ЭТОТ НОВЫЙ МЕТОД ===
    /**
     * Перехватывает ошибки валидации DTO (например, CreateApplicationRequest).
     * @param ex Исключение, содержащее все ошибки валидации.
     * @return ResponseEntity со статусом 400 и списком ошибок.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationExceptions(MethodArgumentNotValidException ex) {
        // Собираем все сообщения об ошибках в одну строку
        String errorMessage = ex.getBindingResult().getAllErrors().stream()
                .map(error -> {
                    String fieldName = ((FieldError) error).getField();
                    String message = error.getDefaultMessage();
                    // Можно вернуть более подробное сообщение, например:
                    // return fieldName + ": " + message;
                    return message;
                })
                .collect(Collectors.joining(", ")); // Объединяем ошибки через запятую

        ErrorResponse errorResponse = new ErrorResponse(errorMessage, System.currentTimeMillis());
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST); // 400
    }

    @ExceptionHandler({IllegalArgumentException.class})
    public ResponseEntity<ErrorResponse> handleIllegalArgumentException(IllegalArgumentException ex) {
        ErrorResponse errorResponse = new ErrorResponse(ex.getMessage(), System.currentTimeMillis());
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST); // 400
    }

    @ExceptionHandler({IllegalStateException.class})
    public ResponseEntity<ErrorResponse> handleIllegalStateException(IllegalStateException ex) {
        ErrorResponse errorResponse = new ErrorResponse(ex.getMessage(), System.currentTimeMillis());
        return new ResponseEntity<>(errorResponse, HttpStatus.CONFLICT); // 409
    }

}