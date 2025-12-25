package ru.kurbangaleev.shop.controllers;

import ru.kurbangaleev.shop.config.JwtCore;
import ru.kurbangaleev.shop.entities.CartItem;
import ru.kurbangaleev.shop.entities.Product;
import ru.kurbangaleev.shop.entities.User;
import ru.kurbangaleev.shop.repositories.CartRepository;
import ru.kurbangaleev.shop.repositories.ProductRepository;
import ru.kurbangaleev.shop.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class CartController {

    private final CartRepository cartRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final JwtCore jwtCore;

    // Метод-помощник для получения юзера из токена
    private User getUserFromToken(String token) {
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        String username = jwtCore.getNameFromJwt(token);
        return userRepository.findByUsername(username).orElseThrow();
    }

    @PostMapping("/add")
    public void addToCart(@RequestHeader("Authorization") String token,
                          @RequestParam Long productId) {
        User user = getUserFromToken(token);
        Product product = productRepository.findById(productId).orElseThrow();

        CartItem item = cartRepository.findByUserAndProduct(user, product)
                .orElse(new CartItem());

        if (item.getId() == null) {
            item.setUser(user);
            item.setProduct(product);
            item.setQuantity(1);
        } else {
            item.setQuantity(item.getQuantity() + 1);
        }
        cartRepository.save(item);
    }

    @GetMapping
    public List<CartItem> getCart(@RequestHeader("Authorization") String token) {
        User user = getUserFromToken(token);
        return cartRepository.findAllByUser(user);
    }

    @DeleteMapping("/{id}")
    public void removeFromCart(@PathVariable Long id) {
        cartRepository.deleteById(id);
    }
}