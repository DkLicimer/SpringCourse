package ru.add.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.add.demo.model.User;

public interface UserRepository extends JpaRepository<User, Long> {
}