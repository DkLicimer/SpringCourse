package ru.kurbangaleev.shop.controllers;

import ru.kurbangaleev.shop.entities.Product;
import ru.kurbangaleev.shop.repositories.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class ProductController {

    private final ProductRepository productRepository;

    // Получить все товары
    @GetMapping
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    // Получить один товар по ID
    @GetMapping("/{id}")
    public Product getProduct(@PathVariable Long id) {
        return productRepository.findById(id).orElseThrow();
    }
}
