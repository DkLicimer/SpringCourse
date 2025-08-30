package ru.kurbangaleev.zabgu_space.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.kurbangaleev.zabgu_space.dto.request.CreateApplicationRequest;
import ru.kurbangaleev.zabgu_space.entity.Application;
import ru.kurbangaleev.zabgu_space.entity.ApplicationStatus;
import ru.kurbangaleev.zabgu_space.entity.Room;
import ru.kurbangaleev.zabgu_space.repository.ApplicationRepository;
import ru.kurbangaleev.zabgu_space.repository.RoomRepository;

import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class ApplicationServiceImpl implements ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final RoomRepository roomRepository;
    private final EmailService emailService;

    public ApplicationServiceImpl(ApplicationRepository applicationRepository, RoomRepository roomRepository, EmailService emailService) {
        this.applicationRepository = applicationRepository;
        this.roomRepository = roomRepository;
        this.emailService = emailService;
    }

    @Override
    @Transactional // Оборачивает метод в транзакцию. Если что-то пойдет не так, все изменения в БД откатятся.
    public Application createApplication(CreateApplicationRequest request) {
        // Шаг 1: Проверка бизнес-правил

        // Правило 1: Найти помещение, иначе выбросить ошибку
        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new IllegalArgumentException("Помещение с ID " + request.getRoomId() + " не найдено"));

        // Правило 2: Проверить, что время бронирования не раньше чем через 24 часа
        if (OffsetDateTime.now().until(request.getStartTime(), ChronoUnit.HOURS) < 24) {
            throw new IllegalArgumentException("Бронировать можно не позднее чем за 24 часа до начала.");
        }

        // Правило 3: Проверить, что время бронирования не дальше чем на месяц вперед
        if (request.getStartTime().isAfter(OffsetDateTime.now().plusMonths(1))) {
            throw new IllegalArgumentException("Бронировать можно не более чем на месяц вперед.");
        }

        // Правило 4: Проверить, что выбранное время не пересекается с уже ОДОБРЕННЫМИ заявками
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
        // Статус PENDING установится по умолчанию

        return applicationRepository.save(application);
    }

    @Override
    public List<Application> getAllApplications(ApplicationStatus status) {
        // Если статус не указан, возвращаем все заявки.
        if (status == null) {
            return applicationRepository.findAll();
        }
        // TODO: В будущем можно оптимизировать, создав метод findByStatus(status) в репозитории.
        return applicationRepository.findAll().stream()
                .filter(app -> app.getStatus() == status)
                .toList();
    }

    @Override
    @Transactional
    public Application approveApplication(Long applicationId) {
        // Шаг 1: Найти заявку или выбросить исключение
        Application appToApprove = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Заявка с ID " + applicationId + " не найдена."));

        // Шаг 2: Изменить статус на APPROVED
        appToApprove.setStatus(ApplicationStatus.APPROVED);
        applicationRepository.save(appToApprove);

        // --- ОТПРАВКА EMAIL ОБ ОДОБРЕНИИ ---
        String subject = "Ваша заявка на бронирование одобрена";
        String text = String.format(
                "Здравствуйте, %s!\n\nВаша заявка №%d на мероприятие '%s' в помещении '%s' была одобрена.\n\nДата и время: с %s по %s.",
                appToApprove.getApplicantFullName(),
                appToApprove.getId(),
                appToApprove.getEventName(),
                appToApprove.getRoom().getName(),
                appToApprove.getStartTime().format(DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm")),
                appToApprove.getEndTime().format(DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm"))
        );
        emailService.sendSimpleMessage(appToApprove.getApplicantEmail(), subject, text);

        // Шаг 3: Найти и отклонить все конфликтующие PENDING заявки
        List<Application> conflictingApps = applicationRepository.findConflictingPendingApplications(
                appToApprove.getRoom().getId(),
                appToApprove.getStartTime(),
                appToApprove.getEndTime(),
                appToApprove.getId() // Исключаем саму одобряемую заявку
        );

        for (Application conflictApp : conflictingApps) {
            conflictApp.setStatus(ApplicationStatus.REJECTED);
            String reason = "Время было занято другой заявкой.";
            conflictApp.setRejectionReason(reason);

            // --- ОТПРАВКА EMAIL ОБ АВТО-ОТКЛОНЕНИИ ---
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
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Заявка с ID " + applicationId + " не найдена."));

        application.setStatus(ApplicationStatus.REJECTED);
        application.setRejectionReason(reason);

        // --- ОТПРАВКА EMAIL ОБ ОТКЛОНЕНИИ ---
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