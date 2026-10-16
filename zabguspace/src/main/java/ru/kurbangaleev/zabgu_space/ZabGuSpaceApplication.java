package ru.kurbangaleev.zabgu_space;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class ZabGuSpaceApplication {

    public static void main(String[] args) {
        SpringApplication.run(ZabGuSpaceApplication.class, args);
    }

}
