package ru.kurbangaleev.zabgu_space.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.kurbangaleev.zabgu_space.dto.request.CreateApplicationRequest;
import ru.kurbangaleev.zabgu_space.entity.Application;
import ru.kurbangaleev.zabgu_space.entity.ApplicationStatus;
import ru.kurbangaleev.zabgu_space.entity.Room;
import ru.kurbangaleev.zabgu_space.repository.ApplicationRepository;
import ru.kurbangaleev.zabgu_space.repository.RoomRepository;

import java.time.OffsetDateTime;
import java.time.ZoneId; // <-- ДОБАВЛЕН ИМПОРТ
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class ApplicationServiceImpl implements ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final RoomRepository roomRepository;
    private final EmailService emailService;
    @Value("${app.booking.min-hours-before}")
    private int minHoursBefore;

    @Value("${app.booking.max-months-ahead}")
    private int maxMonthsAhead;

    public ApplicationServiceImpl(ApplicationRepository applicationRepository, RoomRepository roomRepository, EmailService emailService) {
        this.applicationRepository = applicationRepository;
        this.roomRepository = roomRepository;
        this.emailService = emailService;
    }

    @Override
    @Transactional
    public Application createApplication(CreateApplicationRequest request) {
        // ... (этот метод остается без изменений)
        // Шаг 1: Проверка бизнес-правил
        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new IllegalArgumentException("Помещение с ID " + request.getRoomId() + " не найдено"));

        // === НАЧАЛО ИЗМЕНЕНИЙ ===
        if (OffsetDateTime.now().until(request.getStartTime(), ChronoUnit.HOURS) < minHoursBefore) {
            throw new IllegalArgumentException("Бронировать можно не позднее чем за " + minHoursBefore + " часа до начала.");
        }

        if (request.getStartTime().isAfter(OffsetDateTime.now().plusMonths(maxMonthsAhead))) {
            throw new IllegalArgumentException("Бронировать можно не более чем на " + maxMonthsAhead + " месяц(ев) вперед.");
        }

        boolean isConflict = applicationRepository.existsByRoomIdAndStatusAndStartTimeBeforeAndEndTimeAfter(
                request.getRoomId(),
                ApplicationStatus.APPROVED,
                request.getEndTime(),
                request.getStartTime()
        );

        if (isConflict) {
            throw new IllegalStateException("Выбранное время уже занято.");
        }

        // Шаг 2: Создание и сохранение сущности
        Application application = new Application();
        application.setRoom(room);
        application.setStartTime(request.getStartTime());
        application.setEndTime(request.getEndTime());
        application.setEventName(request.getEventName());
        application.setSoundEngineerRequired(request.isSoundEngineerRequired());
        application.setApplicantFullName(request.getApplicantFullName());
        application.setApplicantPosition(request.getApplicantPosition());
        application.setApplicantEmail(request.getApplicantEmail());
        application.setApplicantPhone(request.getApplicantPhone());

        return applicationRepository.save(application);
    }

    @Override
    public List<Application> getAllApplications(ApplicationStatus status) {
        // ... (этот метод остается без изменений)
        if (status == null) {
            return applicationRepository.findAll();
        }
        return applicationRepository.findAll().stream()
                .filter(app -> app.getStatus() == status)
                .toList();
    }

    @Override
    @Transactional
    public Application approveApplication(Long applicationId) {
        Application appToApprove = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Заявка с ID " + applicationId + " не найдена."));

        appToApprove.setStatus(ApplicationStatus.APPROVED);
        applicationRepository.save(appToApprove);

        // --- ИСПРАВЛЕНИЕ НАЧИНАЕТСЯ ЗДЕСЬ ---

        // 1. Определяем нужный часовой пояс (Чита)
        ZoneId chitaZone = ZoneId.of("Asia/Chita");
        // 2. Создаем форматтер для красивого вывода даты и времени
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");

        // 3. Конвертируем время начала и конца в часовой пояс Читы и форматируем в строку
        String formattedStartTime = appToApprove.getStartTime().atZoneSameInstant(chitaZone).format(formatter);
        String formattedEndTime = appToApprove.getEndTime().atZoneSameInstant(chitaZone).format(formatter);

        // --- ОТПРАВКА EMAIL ОБ ОДОБРЕНИИ С КОРРЕКТНЫМ ВРЕМЕНЕМ ---
        String subject = "Ваша заявка на бронирование одобрена";
        String text = String.format(
                "Здравствуйте, %s!\n\nВаша заявка №%d на мероприятие '%s' в помещении '%s' была одобрена.\n\nДата и время: с %s по %s.",
                appToApprove.getApplicantFullName(),
                appToApprove.getId(),
                appToApprove.getEventName(),
                appToApprove.getRoom().getName(),
                formattedStartTime, // <-- Используем отформатированную строку
                formattedEndTime    // <-- Используем отформатированную строку
        );
        emailService.sendSimpleMessage(appToApprove.getApplicantEmail(), subject, text);

        // --- ИСПРАВЛЕНИЕ ЗАКАНЧИВАЕТСЯ ЗДЕСЬ ---

        List<Application> conflictingApps = applicationRepository.findConflictingPendingApplications(
                appToApprove.getRoom().getId(),
                appToApprove.getStartTime(),
                appToApprove.getEndTime(),
                appToApprove.getId()
        );

        for (Application conflictApp : conflictingApps) {
            conflictApp.setStatus(ApplicationStatus.REJECTED);
            String reason = "Время было занято другой заявкой.";
            conflictApp.setRejectionReason(reason);

            String conflictSubject = "Ваша заявка на бронирование отклонена";
            String conflictText = String.format(
                    "Здравствуйте, %s!\n\nВаша заявка №%d на мероприятие '%s' была автоматически отклонена.\nПричина: %s",
                    conflictApp.getApplicantFullName(),
                    conflictApp.getId(),
                    conflictApp.getEventName(),
                    reason
            );
            emailService.sendSimpleMessage(conflictApp.getApplicantEmail(), conflictSubject, conflictText);
        }
        applicationRepository.saveAll(conflictingApps);

        return appToApprove;
    }

    @Override
    @Transactional
    public Application rejectApplication(Long applicationId, String reason) {
        // ... (этот метод остается без изменений)
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Заявка с ID " + applicationId + " не найдена."));

        application.setStatus(ApplicationStatus.REJECTED);
        application.setRejectionReason(reason);

        String subject = "Ваша заявка на бронирование отклонена";
        String text = String.format(
                "Здравствуйте, %s!\n\nВаша заявка №%d на мероприятие '%s' была отклонена.\n\nПричина: %s",
                application.getApplicantFullName(),
                application.getId(),
                application.getEventName(),
                reason
        );
        emailService.sendSimpleMessage(application.getApplicantEmail(), subject, text);

        return applicationRepository.save(application);
    }
}