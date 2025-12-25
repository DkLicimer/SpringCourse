package ru.kurbangaleev.shop.repositories;

import ru.kurbangaleev.shop.entities.Product;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {
}