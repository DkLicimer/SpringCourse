package ru.add.demo;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import ru.add.demo.model.Transaction;
import ru.add.demo.model.User;
import ru.add.demo.repository.TransactionRepository;
import ru.add.demo.repository.UserRepository;

import java.math.BigDecimal;
import java.time.LocalDate;

@SpringBootApplication
public class DemoApplication {

	public static void main(String[] args) {
		SpringApplication.run(DemoApplication.class, args);
	}

	// Этот бин выполнится один раз при запуске приложения
	@Bean
	CommandLineRunner initDatabase(UserRepository userRepo, TransactionRepository transRepo) {
		return args -> {
			// Если база пустая — заполняем её
			if (userRepo.count() == 0) {
				User user = new User();
				user.setFullName("Иван Иванов");
				user.setBalance(new BigDecimal("124530"));
				user.setSavings(new BigDecimal("52000"));
				userRepo.save(user);

				Transaction t1 = new Transaction();
				t1.setUser(user);
				t1.setName("Зарплата");
				t1.setCategory("Доход");
				t1.setDate(LocalDate.now());
				t1.setAmount(new BigDecimal("38200"));
				t1.setPositive(true);
				transRepo.save(t1);

				Transaction t2 = new Transaction();
				t2.setUser(user);
				t2.setName("Продукты");
				t2.setCategory("Расход");
				t2.setDate(LocalDate.now().minusDays(1));
				t2.setAmount(new BigDecimal("3400"));
				t2.setPositive(false);
				transRepo.save(t2);

				Transaction t3 = new Transaction();
				t3.setUser(user);
				t3.setName("Аренда");
				t3.setCategory("Расход");
				t3.setDate(LocalDate.now().minusDays(2));
				t3.setAmount(new BigDecimal("18000"));
				t3.setPositive(false);
				transRepo.save(t3);
			}
		};
	}
}