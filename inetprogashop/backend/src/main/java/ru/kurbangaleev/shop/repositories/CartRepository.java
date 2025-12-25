package ru.kurbangaleev.shop.repositories;

import ru.kurbangaleev.shop.entities.CartItem;
import ru.kurbangaleev.shop.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CartRepository extends JpaRepository<CartItem, Long> {
    List<CartItem> findAllByUser(User user);
    Optional<CartItem> findByUserAndProduct(User user, ru.kurbangaleev.shop.entities.Product product);
}