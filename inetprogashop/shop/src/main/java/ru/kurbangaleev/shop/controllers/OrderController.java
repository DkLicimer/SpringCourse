package ru.kurbangaleev.shop.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import ru.kurbangaleev.shop.config.JwtCore;
import ru.kurbangaleev.shop.entities.*;
import ru.kurbangaleev.shop.repositories.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final UserRepository userRepository;
    private final JwtCore jwtCore;

    private User getUser(String token) {
        if (token.startsWith("Bearer ")) token = token.substring(7);
        String username = jwtCore.getNameFromJwt(token);
        return userRepository.findByUsername(username).orElseThrow();
    }

    @PostMapping("/checkout")
    public Order checkout(@RequestHeader("Authorization") String token) {
        User user = getUser(token);
        List<CartItem> cartItems = cartRepository.findAllByUser(user);

        if (cartItems.isEmpty()) {
            throw new RuntimeException("Корзина пуста");
        }

        Order order = new Order();
        order.setUser(user);
        order.setCreatedAt(LocalDateTime.now());
        order.setStatus("COMPLETED");

        double total = 0;
        List<OrderItem> orderItems = new ArrayList<>();

        for (CartItem ci : cartItems) {
            OrderItem oi = new OrderItem();
            oi.setOrder(order);
            oi.setProduct(ci.getProduct());
            oi.setQuantity(ci.getQuantity());
            oi.setPriceAtPurchase(ci.getProduct().getPrice());

            total += ci.getProduct().getPrice() * ci.getQuantity();
            orderItems.add(oi);
        }

        order.setTotalPrice(total);
        order.setItems(orderItems);

        // Сохраняем заказ (OrderItem сохранятся каскадом)
        Order savedOrder = orderRepository.save(order);

        // Очищаем корзину
        cartRepository.deleteAll(cartItems);

        return savedOrder;
    }

    @GetMapping("/history")
    public List<Order> getHistory(@RequestHeader("Authorization") String token) {
        User user = getUser(token);
        return orderRepository.findAllByUserOrderByCreatedAtDesc(user);
    }
}