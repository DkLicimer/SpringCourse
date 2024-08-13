package ru.kurbangaleev.orderservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ru.kurbangaleev.orderservice.model.Cart;

@Repository
public interface CartRepository extends JpaRepository<Cart, Long> {
}
