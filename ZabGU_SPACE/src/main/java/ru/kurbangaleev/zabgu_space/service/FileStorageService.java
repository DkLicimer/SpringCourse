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

    // VVVV ДОБАВЬТЕ ЭТОТ МЕТОД VVVV
    public void deleteFile(String imagePath) {
        // Проверяем, что путь не пустой и не является путем по умолчанию
        if (imagePath == null || imagePath.isBlank() || !imagePath.startsWith("/uploads/")) {
            return;
        }

        try {
            // Извлекаем только имя файла из URL-пути (например, из "/uploads/image.jpg" получаем "image.jpg")
            String fileName = Paths.get(imagePath).getFileName().toString();
            Path targetLocation = this.fileStorageLocation.resolve(fileName);

            // Безопасное удаление файла: не вызовет ошибку, если файла уже нет
            Files.deleteIfExists(targetLocation);
        } catch (IOException ex) {
            // В реальном приложении здесь стоило бы использовать логгер
            System.err.println("Не удалось удалить файл: " + imagePath);
            // Мы не "пробрасываем" исключение дальше, чтобы не прерывать
            // процесс удаления записи из БД, даже если файл удалить не удалось.
        }
    }
    // ^^^^ КОНЕЦ НОВОГО МЕТОДА ^^^^

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
            return "/uploads/" + fileName;
        } catch (IOException ex) {
            throw new RuntimeException("Не удалось сохранить файл " + fileName, ex);
        }
    }
}