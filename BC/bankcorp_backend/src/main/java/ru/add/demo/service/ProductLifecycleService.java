package ru.add.demo.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.add.demo.model.*;
import ru.add.demo.repository.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class ProductLifecycleService {
    private final UserRepository userRepository;
    private final ContractRepository contractRepository;
    private final BankCardRepository bankCardRepository;

    // Инициализация базового пакета при регистрации клиента (ДКБО + Счет/Карта)
    @Transactional
    public void initiateDefaultClientPackage(User user) {
        // 1. Формируем и автоматически подписываем ДКБО (согласие дается при KYC)
        String template = """
                ДОГОВОР КОМПЛЕКСНОГО БАНКОВСКОГО ОБСЛУЖИВАНИЯ (БАЗОВЫЙ) № %d
                
                г. Москва                               Дата: %s
                
                ПАО "BankCorp" и гражданин РФ %s, паспорт %s, 
                зарегистрированный по адресу: %s, заключили настоящий договор.
                
                В рамках договора Клиенту открывается Текущий счет и выпускается Дебетовая карта.
                """;

        String text = String.format(template,
                System.currentTimeMillis() % 100000, LocalDate.now(), user.getFullName(),
                user.getPassportSeriesNumber(), user.getRegistrationAddress());

        Contract contract = new Contract();
        contract.setUser(user);
        contract.setProductType("BASE_ACCOUNT");
        contract.setContractText(text);
        contract.setSigned(true);
        contract.setSignedAt(LocalDateTime.now());
        contractRepository.save(contract);

        // 2. Открываем счет и привязываем дебетовую карту
        BankCard card = new BankCard();
        card.setUser(user);
        card.setCardType("DEBIT_CARD");
        // Генерация случайного номера карты 4281 XXXX XXXX XXXX
        card.setCardNumber(String.format("4281 %04d %04d %04d",
                new Random().nextInt(10000), new Random().nextInt(10000), new Random().nextInt(10000)));
        card.setExpiryDate(LocalDate.now().plusYears(5)); // Карта на 5 лет
        card.setSecretWord("BANKCORP_AUTO");
        card.setActive(true);
        card.setCardBalance(BigDecimal.ZERO);
        bankCardRepository.save(card);
    }

    public Contract generateContract(Long userId, String productType) {
        User user = userRepository.findById(userId).orElseThrow();
        // ... (оставляем старый код без изменений)
        String template = """
                ДОГОВОР О ВЫПУСКЕ ПРОДУКТА
                
                г. Москва                               Дата: %s
                
                ПАО "BankCorp", далее именуемый "Банк", и гражданин РФ %s, 
                паспорт серия и номер %s, выдан %s, зарегистрированный по адресу: %s, 
                далее именуемый "Клиент", заключили настоящий договор о выпуске: %s.
                """;

        String text = String.format(template,
                LocalDate.now(), user.getFullName(), user.getPassportSeriesNumber(),
                user.getPassportIssuedBy(), user.getRegistrationAddress(), productType);

        Contract contract = new Contract();
        contract.setUser(user);
        contract.setProductType(productType);
        contract.setContractText(text);
        contract.setSigned(false);

        return contractRepository.save(contract);
    }

    @Transactional
    public BankCard signContractAndIssueCard(Long contractId, String secretWord) {
        Contract contract = contractRepository.findById(contractId).orElseThrow();
        if (contract.isSigned()) throw new IllegalStateException("Договор уже подписан");

        contract.setSigned(true);
        contract.setSignedAt(LocalDateTime.now());
        contractRepository.save(contract);

        BankCard card = new BankCard();
        card.setUser(contract.getUser());
        card.setCardType(contract.getProductType());
        card.setCardNumber(String.format("4281 %04d %04d %04d",
                new Random().nextInt(10000), new Random().nextInt(10000), new Random().nextInt(10000)));
        card.setExpiryDate(LocalDate.now().plusYears(4));
        card.setSecretWord(secretWord);
        card.setActive(true);

        return bankCardRepository.save(card);
    }

    public List<BankCard> getClientCards(Long userId) {
        return bankCardRepository.findByUserId(userId);
    }
}