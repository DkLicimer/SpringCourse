package ru.kurbangaleev.zabgu_space.service;

import org.springframework.web.multipart.MultipartFile;
import ru.kurbangaleev.zabgu_space.dto.request.RoomRequest; // <-- Добавить импорт
import ru.kurbangaleev.zabgu_space.entity.Room;
import java.util.List;

public interface RoomService {
    List<Room> getAllRooms();

    // Обновляем сигнатуры методов
    Room createRoom(String name, String address, String capacity, MultipartFile imageFile);
    Room updateRoom(Long id, String name, String address, String capacity, MultipartFile imageFile);

    void deleteRoom(Long id);
}