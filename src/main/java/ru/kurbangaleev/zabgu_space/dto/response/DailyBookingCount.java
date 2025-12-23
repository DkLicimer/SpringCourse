package ru.kurbangaleev.zabgu_space.dto.response;

import java.time.LocalDate;

// Это интерфейс-проекция для сложного SQL-запроса.
// Spring Data JPA сможет автоматически создавать его экземпляры.
public interface DailyBookingCount {
    LocalDate getDate();
    Integer getBookingCount();
}