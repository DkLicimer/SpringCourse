package ru.add.demo.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import ru.add.demo.dto.RegistrationRequest;
import ru.add.demo.model.User;
import ru.add.demo.repository.UserRepository;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RegistrationService {
    private final UserRepository userRepository;
    private final String UPLOAD_DIR = "uploads/";

    public User registerClient(RegistrationRequest request, MultipartFile documentPhoto) throws IOException {
        // Имитация скоринга и проверки по базам
        if (userRepository.findAll().stream().anyMatch(u -> u.getPassportSeriesNumber() != null && u.getPassportSeriesNumber().equals(request.getPassportSeriesNumber()))) {
            throw new IllegalArgumentException("Клиент с таким паспортом уже существует!");
        }

        User user = new User();
        user.setLastName(request.getLastName());
        user.setFirstName(request.getFirstName());
        user.setMiddleName(request.getMiddleName());
        user.setBirthDate(request.getBirthDate());
        user.setPhone(request.getPhone());
        user.setPassportSeriesNumber(request.getPassportSeriesNumber());
        user.setPassportIssueDate(request.getPassportIssueDate());
        user.setPassportIssuedBy(request.getPassportIssuedBy());
        user.setRegistrationAddress(request.getRegistrationAddress());

        // Обработка фото (имитация KYC)
        if (documentPhoto != null && !documentPhoto.isEmpty()) {
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) Files.createDirectories(uploadPath);

            String fileName = UUID.randomUUID().toString() + "_" + documentPhoto.getOriginalFilename();
            Path filePath = uploadPath.resolve(fileName);
            Files.copy(documentPhoto.getInputStream(), filePath);

            user.setPhotoUrl(filePath.toString());
            user.setVerified(true); // В реальности тут отправка в AI сервис и ожидание webhook
        } else {
            throw new IllegalArgumentException("Фото документа обязательно для KYC");
        }

        return userRepository.save(user);
    }
}