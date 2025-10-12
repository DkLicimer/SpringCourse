package ru.kurbangaleev.zabgu_space.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // <-- Добавить импорт
import org.springframework.web.multipart.MultipartFile;
import ru.kurbangaleev.zabgu_space.dto.request.RoomRequest; // <-- Добавить импорт
import ru.kurbangaleev.zabgu_space.entity.Room;
import ru.kurbangaleev.zabgu_space.repository.ApplicationRepository; // <-- Добавить импорт
import ru.kurbangaleev.zabgu_space.repository.RoomRepository;

import java.util.List;

@Service
public class RoomServiceImpl implements RoomService {

    private final RoomRepository roomRepository;
    private final ApplicationRepository applicationRepository; // <-- Добавить зависимость
    private final FileStorageService fileStorageService;

    @Autowired
    public RoomServiceImpl(RoomRepository roomRepository, ApplicationRepository applicationRepository, FileStorageService fileStorageService) { // <-- Обновить конструктор
        this.roomRepository = roomRepository;
        this.applicationRepository = applicationRepository;
        this.fileStorageService = fileStorageService;
    }

    @Override
    public List<Room> getAllRooms() {
        return roomRepository.findAll();
    }

    // VVVV Реализовать новые методы VVVV

    @Override
    @Transactional
    public Room createRoom(String name, String address, String capacity, MultipartFile imageFile) {
        String imagePath = fileStorageService.storeFile(imageFile); // Сохраняем файл и получаем путь

        Room newRoom = new Room();
        newRoom.setName(name);
        newRoom.setAddress(address);
        newRoom.setCapacity(capacity);
        newRoom.setImagePath(imagePath); // Сохраняем путь в БД
        return roomRepository.save(newRoom);
    }

    @Override
    @Transactional
    public Room updateRoom(Long id, String name, String address, String capacity, MultipartFile imageFile) {
        Room existingRoom = roomRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Помещение с ID " + id + " не найдено"));

        if (imageFile != null && !imageFile.isEmpty()) {
            String newImagePath = fileStorageService.storeFile(imageFile);
            existingRoom.setImagePath(newImagePath);
            // В продакшене здесь можно было бы добавить логику удаления старого файла
        }

        existingRoom.setName(name);
        existingRoom.setAddress(address);
        existingRoom.setCapacity(capacity);

        return roomRepository.save(existingRoom);
    }

    @Override
    @Transactional
    public void deleteRoom(Long id) {
        // Проверяем, есть ли заявки для этого помещения
        if (applicationRepository.existsByRoomId(id)) {
            throw new IllegalStateException("Нельзя удалить помещение, так как для него существуют заявки.");
        }
        roomRepository.deleteById(id);
    }
}