package ru.kurbangaleev.shop.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.kurbangaleev.shop.entities.Order;
import ru.kurbangaleev.shop.entities.User;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findAllByUserOrderByCreatedAtDesc(User user);
}