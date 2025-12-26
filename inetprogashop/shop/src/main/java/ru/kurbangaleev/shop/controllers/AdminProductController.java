package ru.kurbangaleev.shop.controllers;

import org.springframework.transaction.annotation.Transactional;
import ru.kurbangaleev.shop.entities.CartItem;
import ru.kurbangaleev.shop.entities.Product;
import ru.kurbangaleev.shop.repositories.CartRepository;
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
    private final CartRepository cartRepository;

    @GetMapping
    public List<Product> getAll() { return productRepository.findAll(); }

    @PostMapping("/add")
    public Product addProduct(@RequestParam("name") String name,
                              @RequestParam("description") String description,
                              @RequestParam("price") Double price,
                              @RequestParam("files") MultipartFile[] files) {

        List<String> urls = new ArrayList<>();
        for (MultipartFile file : files) {
            String url = cloudinaryService.uploadFile(file);
            System.out.println("UPLOADED URL: " + url);
            urls.add(url);
        }

        Product product = new Product();
        product.setName(name);
        product.setDescription(description);
        product.setPrice(price);
        product.setImageUrls(urls);

        return productRepository.save(product);
    }

    @PutMapping("/{id}")
    public Product updateProduct(@PathVariable Long id,
                                 @RequestParam("name") String name,
                                 @RequestParam("description") String description,
                                 @RequestParam("price") Double price,
                                 @RequestParam(value = "files", required = false) MultipartFile[] files) {
        Product product = productRepository.findById(id).orElseThrow();
        product.setName(name);
        product.setDescription(description);
        product.setPrice(price);

        if (files != null && files.length > 0) {
            List<String> urls = new ArrayList<>();
            for (MultipartFile file : files) {
                urls.add(cloudinaryService.uploadFile(file));
            }
            product.setImageUrls(urls);
        }
        return productRepository.save(product);
    }

    @DeleteMapping("/{id}")
    @Transactional
    public void delete(@PathVariable Long id) {
        List<CartItem> items = cartRepository.findAll().stream()
                .filter(item -> item.getProduct().getId().equals(id))
                .toList();
        cartRepository.deleteAll(items);

        productRepository.deleteById(id);
    }
}