package ru.add.demo.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import ru.add.demo.dto.RegistrationRequest;
import ru.add.demo.model.User;
import ru.add.demo.repository.UserRepository;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.Period;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RegistrationService {
    private final UserRepository userRepository;
    private final ProductLifecycleService productLifecycleService;
    private final String UPLOAD_DIR = "uploads/";

    @Transactional
    public User registerClient(RegistrationRequest request, MultipartFile documentPhoto) throws IOException {
        // 1. Валидация возраста (по закону РФ паспорт получают в 14, счет можно открыть с 14)
        if (Period.between(request.getBirthDate(), LocalDate.now()).getYears() < 14) {
            throw new IllegalArgumentException("Отказ KYC: Клиенту должно быть не менее 14 лет!");
        }

        // 2. Имитация проверки по базам (дубликаты)
        if (userRepository.findAll().stream().anyMatch(u ->
                request.getPassportSeriesNumber().equals(u.getPassportSeriesNumber()) ||
                        request.getSnils().equals(u.getSnils()))) {
            throw new IllegalArgumentException("Отказ KYC: Клиент с таким паспортом или СНИЛС уже существует!");
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
        user.setDepartmentCode(request.getDepartmentCode());
        user.setSnils(request.getSnils());
        user.setRegistrationAddress(request.getRegistrationAddress());

        // 3. Обработка документа
        if (documentPhoto != null && !documentPhoto.isEmpty()) {
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) Files.createDirectories(uploadPath);

            String fileName = UUID.randomUUID().toString() + "_" + documentPhoto.getOriginalFilename();
            Path filePath = uploadPath.resolve(fileName);
            Files.copy(documentPhoto.getInputStream(), filePath);

            user.setPhotoUrl(filePath.toString());
            user.setVerified(true);
        } else {
            throw new IllegalArgumentException("Фото документа обязательно для KYC");
        }

        // 4. Сохраняем клиента
        User savedUser = userRepository.save(user);

        // 5. ТРИГГЕР ЖИЗНЕННОГО ЦИКЛА: Автоматически открываем ДКБО и первую карту
        productLifecycleService.initiateDefaultClientPackage(savedUser);

        return savedUser;
    }
}