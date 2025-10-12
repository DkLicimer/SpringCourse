package ru.kurbangaleev.zabgu_space.service;

import org.springframework.beans.factory.annotation.Value; // <-- Добавить импорт
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path fileStorageLocation; // <-- Заменяем строку на Path

    // Внедряем значение из application.properties
    public FileStorageService(@Value("${file.upload-dir}") String uploadDir) {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (IOException e) {
            throw new RuntimeException("Не удалось создать директорию для загрузки изображений", e);
        }
    }

    public String storeFile(MultipartFile file) {
        String originalFileName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
        // Очищаем имя файла от недопустимых символов
        String cleanFileName = originalFileName.replaceAll("[^a-zA-Z0-9._-]", "");
        String fileName = UUID.randomUUID().toString() + "_" + cleanFileName;

        try {
            if (fileName.contains("..")) {
                throw new RuntimeException("Имя файла содержит некорректные символы " + fileName);
            }
            Path targetLocation = this.fileStorageLocation.resolve(fileName);
            Files.copy(file.getInputStream(), targetLocation);

            // VVVV ВАЖНОЕ ИЗМЕНЕНИЕ VVVV
            // Возвращаем URL-путь, по которому файл будет доступен, а не путь в файловой системе
            return "ZabGU_WebSiteFrontend/css/images/uploads/" + fileName;
        } catch (IOException ex) {
            throw new RuntimeException("Не удалось сохранить файл " + fileName, ex);
        }
    }
}