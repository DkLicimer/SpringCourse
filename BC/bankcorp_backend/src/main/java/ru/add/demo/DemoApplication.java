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

	@Bean
	CommandLineRunner initDatabase(UserRepository userRepo, TransactionRepository transRepo) {
		return args -> {
			if (userRepo.count() == 0) {
				User c1 = new User();
				// ЗАМЕНИЛИ setFullName на 3 отдельных поля:
				c1.setLastName("Смирнов");
				c1.setFirstName("Алексей");
				c1.setMiddleName("Петрович");
				c1.setBalance(new BigDecimal("150000"));
				c1.setSavings(new BigDecimal("50000"));
				// Для демо-данных добавим обязательные поля KYC
				c1.setPassportSeriesNumber("1234 567890");
				c1.setRegistrationAddress("г. Москва, ул. Пушкина, д. 10");
				userRepo.save(c1);

				Transaction t1 = new Transaction();
				t1.setUser(c1);
				t1.setName("Внесение наличных через кассу");
				t1.setCategory("Доход");
				t1.setDate(LocalDate.now().minusDays(5));
				t1.setAmount(new BigDecimal("150000"));
				t1.setPositive(true);
				transRepo.save(t1);

				Transaction t2 = new Transaction();
				t2.setUser(c1);
				t2.setName("Оплата услуг ЖКХ");
				t2.setCategory("Расход");
				t2.setDate(LocalDate.now().minusDays(1));
				t2.setAmount(new BigDecimal("8500"));
				t2.setPositive(false);
				transRepo.save(t2);

				User c2 = new User();
				// ЗАМЕНИЛИ setFullName на 3 отдельных поля:
				c2.setLastName("Ковалева");
				c2.setFirstName("Елена");
				c2.setMiddleName("Васильевна");
				c2.setBalance(new BigDecimal("25000"));
				c2.setSavings(new BigDecimal("0"));
				c2.setPassportSeriesNumber("0987 654321");
				c2.setRegistrationAddress("г. Санкт-Петербург, Невский пр-т, д. 1");
				userRepo.save(c2);

				Transaction t3 = new Transaction();
				t3.setUser(c2);
				t3.setName("Пополнение счета");
				t3.setCategory("Доход");
				t3.setDate(LocalDate.now());
				t3.setAmount(new BigDecimal("25000"));
				t3.setPositive(true);
				transRepo.save(t3);
			}
		};
	}
}