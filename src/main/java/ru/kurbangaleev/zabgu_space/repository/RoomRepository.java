package ru.kurbangaleev.zabgu_space.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ru.kurbangaleev.zabgu_space.entity.Room;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {
    // На данный момент здесь пусто.
    // Spring Data JPA предоставит нам все необходимые методы.
    // Если в будущем нам понадобится, например, найти комнату по имени,
    // мы просто добавим сюда метод: `Optional<Room> findByName(String name);`
}