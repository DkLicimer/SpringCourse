package ru.kurbangaleev.zabgu_space.controller;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.kurbangaleev.zabgu_space.dto.response.ScheduleItemResponse;
import ru.kurbangaleev.zabgu_space.entity.Application;
import ru.kurbangaleev.zabgu_space.entity.ApplicationStatus;
import ru.kurbangaleev.zabgu_space.entity.Room;
import ru.kurbangaleev.zabgu_space.repository.ApplicationRepository; // <-- ДОБАВЬТЕ ЭТОТ ИМПОРТ
import ru.kurbangaleev.zabgu_space.repository.RoomRepository;
import ru.kurbangaleev.zabgu_space.service.RoomService;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime; // <-- И ЭТОТ
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/rooms")
public class RoomController {

    private final RoomService roomService;
    private final ApplicationRepository applicationRepository; // <-- ДОБАВЬТЕ ЭТУ ЗАВИСИМОСТЬ
    private final RoomRepository roomRepository;

    // ОБНОВИТЕ КОНСТРУКТОР
    public RoomController(RoomService roomService, ApplicationRepository applicationRepository, RoomRepository roomRepository) {
        this.roomService = roomService;
        this.applicationRepository = applicationRepository;
        this.roomRepository = roomRepository;
    }

    @GetMapping
    public List<Room> getAllRooms() {
        return roomService.getAllRooms();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Room> getRoomById(@PathVariable Long id) {
        // Найдем комнату в репозитории и вернем ее.
        // Если комната не найдена, вернется ошибка 404 Not Found.
        return roomRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // VVVV ДОБАВЬТЕ ВЕСЬ ЭТОТ НОВЫЙ МЕТОД VVVV
    @GetMapping("/{id}/schedule")
// ИЗМЕНЕНИЕ: Метод теперь возвращает List<ScheduleItemResponse>
    public List<ScheduleItemResponse> getRoomSchedule(
            @PathVariable Long id,
            @RequestParam("start_date") String startDateStr,
            @RequestParam("end_date") String endDateStr) {

        DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE;
        LocalDate startDate = LocalDate.parse(startDateStr, formatter);
        LocalDate endDate = LocalDate.parse(endDateStr, formatter);

        OffsetDateTime startDateTime = startDate.atStartOfDay().atOffset(ZoneOffset.UTC);
        OffsetDateTime endDateTime = endDate.atTime(LocalTime.MAX).atOffset(ZoneOffset.UTC);

        // 1. Получаем список сущностей Application из репозитория
        List<Application> applications = applicationRepository.findApprovedApplicationsInDateRange(
                id,
                ApplicationStatus.APPROVED,
                startDateTime,
                endDateTime
        );

        // 2. Преобразуем (мапим) каждую сущность в наш новый DTO
        return applications.stream()
                .map(app -> new ScheduleItemResponse(
                        app.getEventName(),
                        app.getStartTime(),
                        app.getEndTime()
                ))
                .collect(Collectors.toList());
    }
}