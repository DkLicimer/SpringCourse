package ru.kurbangaleev.orderservice.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import ru.kurbangaleev.orderservice.client.ProductServiceClient;
import ru.kurbangaleev.orderservice.model.Cart;
import ru.kurbangaleev.orderservice.model.CartItem;
import ru.kurbangaleev.orderservice.repository.CartRepository;

import java.util.ArrayList;

@Service
@Slf4j
public class CartService {
    private final CartRepository cartRepository;
    private final ProductServiceClient productServiceClient;

    @Autowired
    public CartService(CartRepository cartRepository, ProductServiceClient productServiceClient) {
        this.cartRepository = cartRepository;
        this.productServiceClient = productServiceClient;
    }

    public Cart getCart(Long userId) {
        return cartRepository.findById(userId)
                .orElse(new Cart(userId, new ArrayList<>()));
    }

    public Cart addToCart(Long userId, Long productId, Integer quantity) {
        Cart cart = getCart(userId);

        if (!productServiceClient.isProductAvailable(productId, quantity)) {
            throw new IllegalArgumentException("The product is not available in the requested quantity");
        }

        CartItem item = cart.getItems().stream()
                .filter(i -> i.getProductId().equals(productId))
                .findFirst()
                .orElse(new CartItem(null, productId, 0, null));

        item.setQuantity(item.getQuantity() + quantity);

        if (!cart.getItems().contains(item)) {
            cart.getItems().add(item);
        }

        return cartRepository.save(cart);
    }

    public Cart removeFromCart(Long userId, Long productId) {
        Cart cart = getCart(userId);
        cart.getItems().removeIf(item -> item.getProductId().equals(productId));
        return cartRepository.save(cart);
    }
}
