package ru.kurbangaleev.zabgu_space.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import ru.kurbangaleev.zabgu_space.security.jwt.JwtAuthFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter; // Внедряем наш фильтр

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) { // Обновляем конструктор
        this.jwtAuthFilter = jwtAuthFilter;
    }
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authz -> authz
                        // Объединяем все разрешенные пути для удобства
                        .requestMatchers(
                                // Наши "чистые" URL для страниц
                                "/",
                                "/rooms",
                                "/schedule",
                                "/apply",
                                "/employee",
                                // Пути к статическим ресурсам (CSS, JS, картинки)
                                "/ZabGU_WebSiteFrontend/**",
                                // Публичные эндпоинты API
                                "/api/auth/**",
                                "/api/rooms/**",
                                "/api/applications/**"
                        ).permitAll() // Разрешаем доступ ко всему, что перечислено выше
                        .anyRequest().authenticated() // Все остальные запросы требуют аутентификации
                );

        // Добавляем наш JWT фильтр в цепочку
        http.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

}