package ru.kurbangaleev.shop.controllers;


import ru.kurbangaleev.shop.entities.Product;
import ru.kurbangaleev.shop.repositories.ProductRepository;
import ru.kurbangaleev.shop.services.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin/products")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class AdminProductController {

    private final ProductRepository productRepository;
    private final CloudinaryService cloudinaryService;

    @PostMapping("/add")
    public Product addProduct(@RequestParam("name") String name,
                              @RequestParam("description") String description,
                              @RequestParam("price") Double price,
                              @RequestParam("file") MultipartFile file) {

        // 1. Загружаем картинку
        String imageUrl = cloudinaryService.uploadFile(file);

        // 2. Создаем объект товара
        Product product = new Product();
        product.setName(name);
        product.setDescription(description);
        product.setPrice(price);
        product.setImageUrl(imageUrl);

        // 3. Сохраняем в БД
        return productRepository.save(product);
    }
}