package ru.kurbangaleev.zabgu_space.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    // Внедряем путь к папке загрузок из application.properties
    @Value("${file.upload-dir}")
    private String uploadDir;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**") // Разрешаем CORS для всех путей, начинающихся с /api/
                .allowedOrigins("*") // ВАЖНО: для разработки. В продакшене нужно указать конкретный домен фронтенда!
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(false); // Установи в true, если используешь куки или http-аутентификацию
    }


    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // URL-шаблон, по которому будут доступны файлы
        registry.addResourceHandler("/uploads/**")
                // Путь в файловой системе, где лежат эти файлы.
                // "file:" - обязательный префикс для указания на внешнюю папку.
                .addResourceLocations("file:" + uploadDir);
    }
}