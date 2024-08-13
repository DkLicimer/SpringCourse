package ru.kurbangaleev.orderservice.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.data.rest.webmvc.ResourceNotFoundException;
import ru.kurbangaleev.orderservice.client.PaymentServiceClient;
import ru.kurbangaleev.orderservice.client.ProductServiceClient;
import ru.kurbangaleev.orderservice.model.Cart;
import ru.kurbangaleev.orderservice.model.CartItem;
import ru.kurbangaleev.orderservice.model.Order;
import ru.kurbangaleev.orderservice.model.OrderItem;
import ru.kurbangaleev.orderservice.repository.OrderRepository;

import javax.transaction.Transactional;
import java.math.BigDecimal;
import java.util.List;

@Service
@Slf4j
public class OrderService {
    private final OrderRepository orderRepository;
    private final CartService cartService;
    private final ProductServiceClient productServiceClient;
    private final PaymentServiceClient paymentServiceClient;

    @Autowired
    public OrderService(OrderRepository orderRepository, CartService cartService,
                        ProductServiceClient productServiceClient, PaymentServiceClient paymentServiceClient) {
        this.orderRepository = orderRepository;
        this.cartService = cartService;
        this.productServiceClient = productServiceClient;
        this.paymentServiceClient = paymentServiceClient;
    }

    @Transactional
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    @Transactional
    public Order createOrder(Long userId, Long productId) {
        Cart cart = cartService.getCart(userId);
        if (cart.getItems().isEmpty()) {
            throw new IllegalStateException("You cannot place an order with an empty cart");
        }

        Order order = new Order();
        order.setUserId(userId);
        order.setStatus("PENDING");

        BigDecimal totalAmount = BigDecimal.ZERO;
        for (CartItem cartItem : cart.getItems()) {
            OrderItem orderItem = new OrderItem();
            orderItem.setProductId(cartItem.getProductId());
            orderItem.setQuantity(cartItem.getQuantity());

            BigDecimal price = productServiceClient.getProductPrice(cartItem.getProductId());
            orderItem.setPrice(price);

            order.getItems().add(orderItem);
            totalAmount = totalAmount.add(price.multiply(new BigDecimal(cartItem.getQuantity())));

            productServiceClient.updateStock(cartItem.getProductId(), cartItem.getQuantity());
        }

        order.setTotalAmount(totalAmount);
        Order saveOrder = orderRepository.save(order);

        cartService.removeFromCart(userId, productId);

        return saveOrder;
    }

    public Order getOrder(Long orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("An order with such an id was not found" + orderId));
    }

    @Transactional
    public Order processPayment(Long orderId) {
        Order order = getOrder(orderId);
        if (!"PENDING".equals(order.getStatus())) {
            throw new IllegalArgumentException("Unable to process payment for an incomplete order");
        }

        boolean paymentSuccess = paymentServiceClient.processPayment(order.getUserId(), order.getTotalAmount());

        if (paymentSuccess) {
            order.setStatus("PAID");
            return orderRepository.save(order);
        } else {
            throw new RuntimeException("Failed to make payment for the order" + orderId);
        }
    }
}

