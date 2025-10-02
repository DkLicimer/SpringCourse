package ru.kurbangaleev.zabgu_space.service;


import ru.kurbangaleev.zabgu_space.dto.request.CreateApplicationRequest;
import ru.kurbangaleev.zabgu_space.entity.Application;
import ru.kurbangaleev.zabgu_space.entity.ApplicationStatus;

import java.util.List;

public interface ApplicationService {
    Application createApplication(CreateApplicationRequest request);

    List<Application> getAllApplications(ApplicationStatus status);

    Application approveApplication(Long applicationId);

    Application rejectApplication(Long applicationId, String reason);
}
