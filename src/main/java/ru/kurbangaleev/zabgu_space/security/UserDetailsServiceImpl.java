package ru.kurbangaleev.zabgu_space.security;

import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import ru.kurbangaleev.zabgu_space.entity.Employee;
import ru.kurbangaleev.zabgu_space.repository.EmployeeRepository;

import java.util.Collections;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private final EmployeeRepository employeeRepository;

    public UserDetailsServiceImpl(EmployeeRepository employeeRepository) {
        this.employeeRepository = employeeRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Employee employee = employeeRepository.findByLogin(username)
                .orElseThrow(() -> new UsernameNotFoundException("Сотрудник с логином '" + username + "' не найден"));

        return new User(
                employee.getLogin(),
                employee.getPasswordHash(),
                Collections.emptyList() // У нас нет ролей, поэтому список прав пуст
        );
    }
}
