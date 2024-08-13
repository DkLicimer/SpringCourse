package ru.kurbangaleev.orderservice.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import ru.kurbangaleev.orderservice.model.Order;
import ru.kurbangaleev.orderservice.service.OrderService;

import java.util.List;

@Controller
@RequestMapping("/order")
public class OrderController {
    private final OrderService orderService;

    @Autowired
    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping()
    public String listOrders(Model model) {
        List<Order> orders = orderService.getAllOrders();
        model.addAttribute("orders", orders);
        return "order/orderList";
    }

    @PostMapping
    public String createOrder(@RequestParam Long userId, @RequestParam Long productID, Model model) {
        Order order = orderService.createOrder(userId, productID);
        model.addAttribute("order", order);
        return "order/orderCreated";
    }

    @GetMapping("/{orderId}")
    public String getOrder(@PathVariable Long orderId, Model model) {
        Order order = orderService.getOrder(orderId);
        model.addAttribute("order", order);
        return "order/orderDetails";
    }

    @PostMapping("/{orderId}/payment")
    public String processPayment(@PathVariable Long orderId, Model model) {
        Order order = orderService.processPayment(orderId);
        model.addAttribute("order", order);
        return "order/paymentProcessed";
    }
}