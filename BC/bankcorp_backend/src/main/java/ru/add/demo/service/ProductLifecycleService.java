package ru.add.demo.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.add.demo.model.*;
import ru.add.demo.repository.*;

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

    // Шаг 1: Генерация договора на основе данных клиента
    public Contract generateContract(Long userId, String productType) {
        User user = userRepository.findById(userId).orElseThrow();

        String template = """
                ДОГОВОР КОМПЛЕКСНОГО БАНКОВСКОГО ОБСЛУЖИВАНИЯ
                
                г. Москва                               Дата: %s
                
                ПАО "BankCorp", далее именуемый "Банк", и гражданин РФ %s, 
                паспорт серия и номер %s, выдан %s, зарегистрированный по адресу: %s, 
                далее именуемый "Клиент", заключили настоящий договор о выпуске: %s.
                
                Клиент подтверждает согласие с тарифами банка и дает согласие на обработку ПД.
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

    // Шаг 2: Подписание договора и выпуск продукта
    @Transactional
    public BankCard signContractAndIssueCard(Long contractId, String secretWord) {
        Contract contract = contractRepository.findById(contractId).orElseThrow();
        if (contract.isSigned()) throw new IllegalStateException("Договор уже подписан");

        contract.setSigned(true);
        contract.setSignedAt(LocalDateTime.now());
        contractRepository.save(contract);

        // Генерация реквизитов карты
        BankCard card = new BankCard();
        card.setUser(contract.getUser());
        card.setCardType(contract.getProductType());
        card.setCardNumber("4281 " + (new Random().nextInt(9000) + 1000) + " " + (new Random().nextInt(9000) + 1000) + " " + (new Random().nextInt(9000) + 1000));
        card.setExpiryDate(LocalDate.now().plusYears(4));
        card.setSecretWord(secretWord);
        card.setActive(true);

        return bankCardRepository.save(card);
    }

    public List<BankCard> getClientCards(Long userId) {
        return bankCardRepository.findByUserId(userId);
    }
}