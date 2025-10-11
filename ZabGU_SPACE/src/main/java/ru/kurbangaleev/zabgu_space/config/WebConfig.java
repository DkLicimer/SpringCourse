package ru.kurbangaleev.zabgu_space.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**") // Разрешаем CORS для всех путей, начинающихся с /api/
                .allowedOrigins("*") // ВАЖНО: для разработки. В продакшене нужно указать конкретный домен фронтенда!
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(false); // Установи в true, если используешь куки или http-аутентификацию
    }
}