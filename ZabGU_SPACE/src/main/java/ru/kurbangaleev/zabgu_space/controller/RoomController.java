package ru.kurbangaleev.zabgu_space.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.kurbangaleev.zabgu_space.entity.Room;
import ru.kurbangaleev.zabgu_space.service.RoomService;

import java.util.List;

@RestController
@RequestMapping("/api/rooms") // Все эндпоинты в этом классе будут начинаться с /api/rooms
public class RoomController {

    private final RoomService roomService;

    public RoomController(RoomService roomService) {
        this.roomService = roomService;
    }

    @GetMapping
    public List<Room> getAllRooms() {
        return roomService.getAllRooms();
    }
}