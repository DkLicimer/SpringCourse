package ru.kurbangaleev.zabgu_space.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    @Query("SELECT new ru.kurbangaleev.zabgu_space.dto.response.RoomBookingCount(a.room.name, COUNT(a)) " +
            "FROM Application a WHERE a.status = 'APPROVED' " +
            "GROUP BY a.room.name ORDER BY COUNT(a) DESC")
    List<RoomBookingCount> getRoomBookingCounts();

    @Query(value = "SELECT CAST(start_time AS DATE) as date, COUNT(*) as bookingCount " +
            "FROM applications " +
            "WHERE status = 'APPROVED' AND start_time >= NOW() - INTERVAL '30 days' " +
            "GROUP BY CAST(start_time AS DATE) " +
            "ORDER BY date ASC", nativeQuery = true)
    List<DailyBookingCount> getDailyBookingActivity();

    List<Application> findByStatusAndStartTimeBetweenOrderByStartTimeAsc(
            ApplicationStatus status,
            OffsetDateTime startDate,
            OffsetDateTime endDate
    );

    // VVVV НАЧАЛО ИЗМЕНЕНИЙ VVVV

    /**
     * Находит все заявки с учетом пагинации и сортировки.
     * @param pageable объект с информацией о странице (номер, размер, сортировка)
     * @return Страница с заявками.
     */
    Page<Application> findAll(Pageable pageable);

    /**
     * Находит все заявки с определенным статусом с учетом пагинации и сортировки.
     * @param status Статус для фильтрации
     * @param pageable объект с информацией о странице
     * @return Страница с заявками.
     */
    Page<Application> findByStatus(ApplicationStatus status, Pageable pageable);

    // ^^^^ КОНЕЦ ИЗМЕНЕНИЙ ^^^^

    @Query("SELECT a FROM Application a WHERE a.room.id = :roomId AND a.status = :status AND a.startTime < :endDate AND a.endTime > :startDate")
    List<Application> findApprovedApplicationsInDateRange(
            Long roomId,
            ApplicationStatus status,
            OffsetDateTime startDate,
            OffsetDateTime endDate
    );

    @Query("SELECT a FROM Application a WHERE a.room.id = :roomId AND a.status = 'PENDING' AND a.id <> :excludeApplicationId AND a.startTime < :endTime AND a.endTime > :startTime")
    List<Application> findConflictingPendingApplications(
            Long roomId,
            OffsetDateTime startTime,
            OffsetDateTime endTime,
            Long excludeApplicationId
    );

    boolean existsByRoomIdAndStatusAndStartTimeBeforeAndEndTimeAfter(
            Long roomId, ApplicationStatus status, OffsetDateTime endTime, OffsetDateTime startTime);

    boolean existsByRoomId(Long roomId);
}