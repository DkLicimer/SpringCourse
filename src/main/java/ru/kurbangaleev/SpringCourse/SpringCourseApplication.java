package ru.kurbangaleev.SpringCourse;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "ru.kurbangaleev.SpringCourse")
public class SpringCourseApplication {
    public static void main(String[] args) {
        SpringApplication.run(SpringCourseApplication.class, args);
    }
}