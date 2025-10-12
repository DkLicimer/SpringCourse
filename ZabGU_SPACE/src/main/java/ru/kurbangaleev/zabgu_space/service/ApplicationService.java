package ru.kurbangaleev.zabgu_space.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import ru.kurbangaleev.zabgu_space.dto.request.CreateApplicationRequest;
import ru.kurbangaleev.zabgu_space.entity.Application;
import ru.kurbangaleev.zabgu_space.entity.ApplicationStatus;

import java.time.OffsetDateTime;
import java.util.List;

public interface ApplicationService {
    Application createApplication(CreateApplicationRequest request);

    // VVVV НАЧАЛО ИЗМЕНЕНИЙ VVVV
    Page<Application> getAllApplications(ApplicationStatus status, Pageable pageable);
    // ^^^^ КОНЕЦ ИЗМЕНЕНИЙ ^^^^

    Application approveApplication(Long applicationId);

    Application rejectApplication(Long applicationId, String reason);

    Application cancelApplication(Long applicationId, String reason);

    List<Application> getApprovedApplicationsForPeriod(OffsetDateTime startDate, OffsetDateTime endDate);
}