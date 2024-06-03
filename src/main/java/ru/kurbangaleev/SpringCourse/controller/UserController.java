package ru.kurbangaleev.SpringCourse.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import ru.kurbangaleev.SpringCourse.entity.User;
import ru.kurbangaleev.SpringCourse.service.UserService;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping("/get")
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }

//    @PostMapping("/create")
//    public ResponseEntity<User> createUser(@RequestBody User user) {
//        User savedUser = userService.saveUser(user);
//        return new ResponseEntity(savedUser, HttpStatus.CREATED);
//    }

    @PostMapping("/create")
    public ResponseEntity<?> createUser(@RequestBody @Validated User user) {
        if (user.getFirstName() == null || user.getFirstName().isEmpty()) {
            return new ResponseEntity<>("First name cannot be empty", HttpStatus.BAD_REQUEST);
        }
        userService.saveUser(user);
        return ResponseEntity.ok().build();
    }



}