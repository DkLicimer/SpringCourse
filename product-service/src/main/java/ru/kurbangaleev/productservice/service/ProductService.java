package ru.kurbangaleev.productservice.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import ru.kurbangaleev.productservice.model.Product;
import ru.kurbangaleev.productservice.repository.ProductRepository;
import org.springframework.data.rest.webmvc.ResourceNotFoundException;


import java.util.List;

@Service
@Slf4j
public class ProductService {
    private final ProductRepository productRepository;

    @Autowired
    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public Product getProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("A product with such an indicator was not found:" + id));
    }

    public Product createProduct(Product product) {
        return productRepository.save(product);
    }

    public Product updateProduct(Long id, Product productDetails) {
        Product product = getProductById(id);
        product.setName(productDetails.getName());
        product.setDescription(productDetails.getDescription());
        product.setPrice(productDetails.getPrice());
        product.setStockQuantity(productDetails.getStockQuantity());
        return productRepository.save(product);
    }

    public void deleteProduct(Long id) {
        Product product = getProductById(id);
        productRepository.delete(product);
    }

    public boolean isProductAvailable(Long id, int quantity) {
        Product product = getProductById(id);
        return product.getStockQuantity() >= quantity;
    }

    public void updateStock(Long id, int quantity) {
        Product product = getProductById(id);
        int newQuantity = product.getStockQuantity() - quantity;
        if (newQuantity < 0) {
            throw new IllegalArgumentException("There is not enough product in stock for an item with an ID:" + quantity);
        }
        product.setStockQuantity(newQuantity);
        productRepository.save(product);
    }
}
