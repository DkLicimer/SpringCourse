package ru.kurbangaleev.zabgu_space.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.kurbangaleev.zabgu_space.dto.request.RejectApplicationRequest;
import ru.kurbangaleev.zabgu_space.dto.response.ApplicationDetailsResponse;
import ru.kurbangaleev.zabgu_space.entity.Application;
import ru.kurbangaleev.zabgu_space.entity.ApplicationStatus;
import ru.kurbangaleev.zabgu_space.service.ApplicationService;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final ApplicationService applicationService;

    public AdminController(ApplicationService applicationService) {
        this.applicationService = applicationService;
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
}
