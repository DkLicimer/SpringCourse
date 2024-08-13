package ru.kurbangaleev.orderservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;
import ru.kurbangaleev.orderservice.dto.ProductDto;

import java.math.BigDecimal;

@FeignClient(name = "product-service")
public interface ProductServiceClient {

    @GetMapping("/api/products/{id}/available")
    boolean isProductAvailable(@PathVariable Long id, @RequestParam int quantity);

    @GetMapping("/api/products/{id}")
    ProductDto getProduct(@PathVariable("id") Long productId);

    @PutMapping(("/api/products/{id}/stock"))
    void updateStock(@PathVariable("id") Long productId, @RequestParam int quantity);

    default BigDecimal getProductPrice(Long productId) {
        return getProduct(productId).getPrice();
    }
}
