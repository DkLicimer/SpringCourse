package ru.kurbangaleev.shop.controllers;

import ru.kurbangaleev.shop.entities.Product;
import ru.kurbangaleev.shop.repositories.ProductRepository;
import ru.kurbangaleev.shop.services.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/admin/products")
@RequiredArgsConstructor
public class AdminProductController {

    private final ProductRepository productRepository;
    private final CloudinaryService cloudinaryService;

    @GetMapping
    public List<Product> getAll() { return productRepository.findAll(); }

    @PostMapping("/add")
    public Product addProduct(@RequestParam("name") String name,
                              @RequestParam("description") String description,
                              @RequestParam("price") Double price,
                              @RequestParam("files") MultipartFile[] files) { // Принимаем массив

        List<String> urls = new ArrayList<>();
        for (MultipartFile file : files) {
            urls.add(cloudinaryService.uploadFile(file));
        }

        Product product = new Product();
        product.setName(name);
        product.setDescription(description);
        product.setPrice(price);
        product.setImageUrls(urls);

        return productRepository.save(product);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) { productRepository.deleteById(id); }
}