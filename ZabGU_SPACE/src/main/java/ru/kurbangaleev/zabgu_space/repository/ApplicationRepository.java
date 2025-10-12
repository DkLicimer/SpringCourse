package ru.kurbangaleev.zabgu_space.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import ru.kurbangaleev.zabgu_space.dto.response.DailyBookingCount;
import ru.kurbangaleev.zabgu_space.dto.response.RoomBookingCount;
import ru.kurbangaleev.zabgu_space.entity.Application;
import ru.kurbangaleev.zabgu_space.entity.ApplicationStatus;

import java.time.OffsetDateTime;
import java.util.List;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {

    long countByStatus(ApplicationStatus status);

    /**
     * Группирует одобренные заявки по помещениям и подсчитывает их количество.
     */
    @Query("SELECT new ru.kurbangaleev.zabgu_space.dto.response.RoomBookingCount(a.room.name, COUNT(a)) " +
            "FROM Application a WHERE a.status = 'APPROVED' " +
            "GROUP BY a.room.name ORDER BY COUNT(a) DESC")
    List<RoomBookingCount> getRoomBookingCounts();

    /**
     * Подсчитывает количество одобренных заявок по дням за последний месяц.
     * Используется нативный SQL-запрос для работы с датами.
     */
    @Query(value = "SELECT CAST(start_time AS DATE) as date, COUNT(*) as bookingCount " +
            "FROM applications " +
            "WHERE status = 'APPROVED' AND start_time >= NOW() - INTERVAL '30 days' " +
            "GROUP BY CAST(start_time AS DATE) " +
            "ORDER BY date ASC", nativeQuery = true)
    List<DailyBookingCount> getDailyBookingActivity();

    /**
     * Находит все ОДОБРЕННЫЕ заявки в заданном временном диапазоне для всех помещений.
     * Используется для календаря администратора.
     * @param status Статус для поиска (всегда APPROVED)
     * @param startDate Начало диапазона
     * @param endDate Конец диапазона
     * @return Список одобренных заявок, отсортированный по времени начала.
     */
    List<Application> findByStatusAndStartTimeBetweenOrderByStartTimeAsc(
            ApplicationStatus status,
            OffsetDateTime startDate,
            OffsetDateTime endDate
    );

    // VVVV ДОБАВЬТЕ ЭТИ ДВА МЕТОДА VVVV

    /**
     * Находит все заявки и сортирует их по полю 'createdAt' в порядке убывания (DESC).
     * Новые заявки будут первыми.
     */
    List<Application> findAllByOrderByCreatedAtDesc();

    /**
     * Находит все заявки с определенным статусом и сортирует их по убыванию даты создания.
     * @param status Статус для фильтрации (PENDING, APPROVED, REJECTED)
     * @return отсортированный список заявок
     */
    List<Application> findByStatusOrderByCreatedAtDesc(ApplicationStatus status);

    // ^^^^ КОНЕЦ НОВЫХ МЕТОДОВ ^^^^

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
