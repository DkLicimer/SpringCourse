package ru.kurbangaleev.zabgu_space.controller;

import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.kurbangaleev.zabgu_space.dto.request.RejectApplicationRequest;
import ru.kurbangaleev.zabgu_space.dto.request.RoomRequest;
import ru.kurbangaleev.zabgu_space.dto.response.AnalyticsResponse;
import ru.kurbangaleev.zabgu_space.dto.response.ApplicationDetailsResponse;
import ru.kurbangaleev.zabgu_space.dto.response.DailyBookingCount;
import ru.kurbangaleev.zabgu_space.dto.response.RoomBookingCount;
import ru.kurbangaleev.zabgu_space.entity.Application;
import ru.kurbangaleev.zabgu_space.entity.ApplicationStatus;
import ru.kurbangaleev.zabgu_space.entity.Room;
import ru.kurbangaleev.zabgu_space.repository.ApplicationRepository;
import ru.kurbangaleev.zabgu_space.service.ApplicationService;
import ru.kurbangaleev.zabgu_space.service.RoomService;
import org.springframework.web.multipart.MultipartFile;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final ApplicationService applicationService;
    private final RoomService roomService;
    private final ApplicationRepository applicationRepository;

    public AdminController(ApplicationService applicationService, RoomService roomService, ApplicationRepository applicationRepository) {
        this.applicationService = applicationService;
        this.roomService = roomService;
        this.applicationRepository = applicationRepository;
    }

    @GetMapping("/analytics")
    public ResponseEntity<AnalyticsResponse> getAnalytics() {
        long total = applicationRepository.count();
        long approved = applicationRepository.countByStatus(ApplicationStatus.APPROVED);
        long rejected = applicationRepository.countByStatus(ApplicationStatus.REJECTED);
        List<RoomBookingCount> popularity = applicationRepository.getRoomBookingCounts();
        List<DailyBookingCount> activity = applicationRepository.getDailyBookingActivity();

        AnalyticsResponse response = AnalyticsResponse.builder()
                .totalApplications(total)
                .approvedApplications(approved)
                .rejectedApplications(rejected)
                .roomPopularity(popularity)
                .dailyActivity(activity)
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/schedule")
    public List<ApplicationDetailsResponse> getScheduleForPeriod(
            @RequestParam("start_date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
            @RequestParam("end_date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate) {

        List<Application> applications = applicationService.getApprovedApplicationsForPeriod(startDate, endDate);
        return applications.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @GetMapping("/applications")
    public List<ApplicationDetailsResponse> getAllApplications(
            @RequestParam(required = false) ApplicationStatus status) {

        List<Application> applications = applicationService.getAllApplications(status);
        // Конвертируем сущности в DTO перед отправкой клиенту
        return applications.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @PostMapping("/applications/{id}/approve")
    public ResponseEntity<ApplicationDetailsResponse> approveApplication(@PathVariable Long id) {
        Application approvedApplication = applicationService.approveApplication(id);
        return ResponseEntity.ok(convertToDto(approvedApplication));
    }

    @PostMapping("/applications/{id}/reject")
    public ResponseEntity<ApplicationDetailsResponse> rejectApplication(
            @PathVariable Long id, @RequestBody RejectApplicationRequest request) {
        Application rejectedApplication = applicationService.rejectApplication(id, request.getReason());
        return ResponseEntity.ok(convertToDto(rejectedApplication));
    }

    // Вспомогательный метод для конвертации Entity -> DTO
    private ApplicationDetailsResponse convertToDto(Application app) {
        return ApplicationDetailsResponse.builder()
                .id(app.getId())
                .eventName(app.getEventName())
                .status(app.getStatus())
                .startTime(app.getStartTime())
                .endTime(app.getEndTime())
                .soundEngineerRequired(app.isSoundEngineerRequired())
                .applicantFullName(app.getApplicantFullName())
                .applicantPosition(app.getApplicantPosition())
                .applicantEmail(app.getApplicantEmail())
                .applicantPhone(app.getApplicantPhone())
                .rejectionReason(app.getRejectionReason())
                .createdAt(app.getCreatedAt())
                .roomId(app.getRoom().getId())
                .roomName(app.getRoom().getName())
                .build();
    }

    // VVVV Добавить новые методы для ПОМЕЩЕНИЙ VVVV

    @PostMapping("/rooms")
    public ResponseEntity<Room> createRoom(
            @RequestParam("name") String name,
            @RequestParam("address") String address,
            @RequestParam("capacity") String capacity,
            @RequestParam("imageFile") MultipartFile imageFile) {
        Room createdRoom = roomService.createRoom(name, address, capacity, imageFile);
        return new ResponseEntity<>(createdRoom, HttpStatus.CREATED);
    }

    @PutMapping("/rooms/{id}")
    public ResponseEntity<Room> updateRoom(
            @PathVariable Long id,
            @RequestParam("name") String name,
            @RequestParam("address") String address,
            @RequestParam("capacity") String capacity,
            @RequestParam(value = "imageFile", required = false) MultipartFile imageFile) {
        Room updatedRoom = roomService.updateRoom(id, name, address, capacity, imageFile);
        return ResponseEntity.ok(updatedRoom);
    }

    @DeleteMapping("/rooms/{id}")
    public ResponseEntity<Void> deleteRoom(@PathVariable Long id) {
        roomService.deleteRoom(id);
        return ResponseEntity.noContent().build(); // Статус 204 No Content
    }
}
