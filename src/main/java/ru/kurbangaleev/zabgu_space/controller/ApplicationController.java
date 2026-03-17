package ru.kurbangaleev.zabgu_space.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.kurbangaleev.zabgu_space.dto.request.CreateApplicationRequest;
import ru.kurbangaleev.zabgu_space.entity.Application;
import ru.kurbangaleev.zabgu_space.service.ApplicationService;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    private final ApplicationService applicationService;

    public ApplicationController(ApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    @PostMapping
    public ResponseEntity<Application> createApplication(@Valid @RequestBody CreateApplicationRequest request) {
        Application createdApplication = applicationService.createApplication(request);
        return new ResponseEntity<>(createdApplication, HttpStatus.CREATED);
    }
}
