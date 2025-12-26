package ru.kurbangaleev.shop.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtFilter extends OncePerRequestFilter {

    private final JwtCore jwtCore;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");
        String username = null;
        String role = null;
        String jwt = null;

        // Если это OPTIONS запрос (CORS), пропускаем сразу
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        // Проверяем наличие заголовка Authorization
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            jwt = authHeader.substring(7);
            try {
                // ВОТ ЭТОГО У ТЕБЯ НЕ ХВАТАЛО: извлекаем данные из JWT
                username = jwtCore.getNameFromJwt(jwt);
                role = jwtCore.getRoleFromJwt(jwt);
            } catch (Exception e) {
                // Если токен невалиден или просрочен - просто логируем или игнорируем,
                // SecurityContext останется пустым, и Spring выдаст 403
                logger.error("Ошибка парсинга JWT: " + e.getMessage());
            }
        }

        // Если данные получены и пользователь еще не аутентифицирован в контексте
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            // Создаем authority на основе роли из токена
            SimpleGrantedAuthority authority = new SimpleGrantedAuthority(role);

            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                    username,
                    null,
                    List.of(authority)
            );

            // Записываем пользователя в контекст Spring Security
            SecurityContextHolder.getContext().setAuthentication(auth);
        }

        filterChain.doFilter(request, response);
    }
}