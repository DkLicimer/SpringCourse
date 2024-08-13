package ru.kurbangaleev.orderservice.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import ru.kurbangaleev.orderservice.model.Cart;
import ru.kurbangaleev.orderservice.service.CartService;

@Controller
@RequestMapping("/cart")
public class CartController {
    private final CartService cartService;

    @Autowired
    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping("/{userId}")
    public String getCart(@PathVariable Long userId, Model model) {
        Cart cart = cartService.getCart(userId);
        model.addAttribute("cart", cart);
        return "cart/cartDetails";
    }

    @PostMapping("/{userId}/items")
    public String addToCart(@PathVariable Long userId, @RequestParam Long productId, @RequestParam int quantity) {
        cartService.addToCart(userId, productId, quantity);
        return "redirect:/cart/" + userId;
    }

    @DeleteMapping("/{userId}/items/{productId}")
    public String removeFromCart(@PathVariable Long userId, @PathVariable Long productId) {
        cartService.removeFromCart(userId, productId);
        return "redirect:/cart/" + userId;
    }
}
