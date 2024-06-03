package ru.kurbangaleev.SpringCourse.service;

import org.springframework.stereotype.Service;
import ru.kurbangaleev.SpringCourse.entity.User;

import java.util.List;
@Service
public interface UserService {
    List<User> getAllUsers();
    User saveUser(User user);
}
