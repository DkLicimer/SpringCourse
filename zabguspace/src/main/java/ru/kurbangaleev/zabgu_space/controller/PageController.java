package ru.kurbangaleev.zabgu_space.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller // Важно: используем @Controller, а не @RestController
public class PageController {

    /**
     * Отдает главную страницу.
     * @return путь к mainPage.html
     */
    @GetMapping("/")
    public String mainPage() {
        // "forward:" выполняет внутреннюю переадресацию на стороне сервера,
        // не меняя URL в адресной строке браузера.
        return "forward:/ZabGU_WebSiteFrontend/mainPage.html";
    }

    /**
     * Отдает страницу выбора помещений.
     * @return путь к roomsPage.html
     */
    @GetMapping("/rooms")
    public String roomsPage() {
        return "forward:/ZabGU_WebSiteFrontend/roomsPage.html";
    }

    /**
     * Отдает страницу выбора даты и времени (расписание).
     * @return путь к dateTimePage.html
     */
    @GetMapping("/schedule")
    public String dateTimePage() {
        return "forward:/ZabGU_WebSiteFrontend/dateTimePage.html";
    }

    /**
     * Отдает страницу подачи заявки.
     * @return путь к applicationPage.html
     */
    @GetMapping("/apply")
    public String applicationPage() {
        return "forward:/ZabGU_WebSiteFrontend/applicationPage.html";
    }

    /**
     * Отдает страницу для сотрудника (вход или админ-панель).
     * @return путь к employeePage.html
     */
    @GetMapping("/employee")
    public String employeePage() {
        return "forward:/ZabGU_WebSiteFrontend/employeePage.html";
    }
}