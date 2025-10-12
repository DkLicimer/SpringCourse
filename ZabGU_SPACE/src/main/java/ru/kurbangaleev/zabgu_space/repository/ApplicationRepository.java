package ru.kurbangaleev.zabgu_space.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import ru.kurbangaleev.zabgu_space.entity.Application;
import ru.kurbangaleev.zabgu_space.entity.ApplicationStatus;

import java.time.OffsetDateTime;
import java.util.List;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {

    /**
     * Находит все ОДОБРЕННЫЕ заявки для конкретного помещения в заданном временном диапазоне.
     * Используется для отображения расписания в календаре.
     */
    @Query("SELECT a FROM Application a WHERE a.room.id = :roomId AND a.status = :status AND a.startTime < :endDate AND a.endTime > :startDate")
    List<Application> findApprovedApplicationsInDateRange(
            Long roomId,
            ApplicationStatus status,
            OffsetDateTime startDate,
            OffsetDateTime endDate
    );
    /**
     * Находит все заявки со статусом PENDING, которые конфликтуют с заданным временным интервалом.
     * Используется для автоматического отклонения конфликтующих заявок при одобрении одной из них.
     * Условие: (start1 < end2) and (end1 > start2)
     */
    @Query("SELECT a FROM Application a WHERE a.room.id = :roomId AND a.status = 'PENDING' AND a.id <> :excludeApplicationId AND a.startTime < :endTime AND a.endTime > :startTime")
    List<Application> findConflictingPendingApplications(
            Long roomId,
            OffsetDateTime startTime,
            OffsetDateTime endTime,
            Long excludeApplicationId // ID заявки, которую мы одобряем, чтобы не отклонить ее саму
    );

    /**
     * Проверяет, есть ли хотя бы одна ОДОБРЕННАЯ заявка, пересекающаяся с заданным интервалом.
     * Используется при создании новой заявки, чтобы не дать пользователю выбрать уже занятое время.
     */
    boolean existsByRoomIdAndStatusAndStartTimeBeforeAndEndTimeAfter(
            Long roomId, ApplicationStatus status, OffsetDateTime endTime, OffsetDateTime startTime);

    boolean existsByRoomId(Long roomId);
}
