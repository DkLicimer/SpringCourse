package ru.kurbangaleev.zabgu_space.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ru.kurbangaleev.zabgu_space.entity.Employee;

import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    /**
     * Находит сотрудника по его логину.
     * Spring Data JPA автоматически сгенерирует SQL-запрос по названию этого метода.
     * @param login логин для поиска
     * @return Optional, содержащий сотрудника, если он найден
     */
    Optional<Employee> findByLogin(String login);
}