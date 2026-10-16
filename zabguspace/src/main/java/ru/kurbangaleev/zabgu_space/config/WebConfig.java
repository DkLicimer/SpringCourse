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
        registry.addMapping("/api/**")
                .allowedOrigins("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(false);
    }


    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {

        // --- ОБРАБОТЧИК ДЛЯ ЗАГРУЖЕННЫХ ПОЛЬЗОВАТЕЛЕМ КАРТИНОК ---
        // URL: /uploads/** -> Файловая система (внутри Docker-тома)
        String resourceLocation = "file:" + uploadDir + "/";
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(resourceLocation);

        // --- ОБРАБОТЧИК ДЛЯ СТАТИЧЕСКИХ КАРТИНОК ИЗ МИГРАЦИЙ ---
        // URL: /images/** -> Ресурсы приложения (classpath)
        registry.addResourceHandler("/images/**")
                .addResourceLocations("classpath:/static/images/");
    }
}