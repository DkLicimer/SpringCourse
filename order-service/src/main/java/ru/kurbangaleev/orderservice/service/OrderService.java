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
    public Order createOrder(Long userId) {
        Cart cart = cartService.getCart(userId);
        if (cart.getItems().isEmpty()) {
            throw new IllegalStateException("Вы не можете оформить заказ с пустой корзиной");
        }

        Order order = new Order();
        order.setUserID(userId);
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

        cartService.removeFromCart(userId);

        return saveOrder;
    }

    public Order getOrder(Long orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Заказ с таким индефикатором не найден" + orderId));
    }

    @Transactional
    public Order processPayment(Long orderId) {
        Order order = getOrder(orderId);
        if (!"PENDING".equals(order.getStatus())) {
            throw new IllegalArgumentException("Не удается обработать платеж по незавершенному заказу");
        }

        boolean paymentSuccess = paymentServiceClient.processPayment(order.getUserID(), order.getTotalAmount());

        if (paymentSuccess) {
            order.setStatus("PAID");
            return orderRepository.save(order);
        } else {
            throw new RuntimeException("Не удалось произвести оплату заказа" + orderId);
        }
    }
}

