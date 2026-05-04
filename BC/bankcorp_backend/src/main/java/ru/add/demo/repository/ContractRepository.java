package ru.add.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.add.demo.model.Contract;

public interface ContractRepository extends JpaRepository<Contract, Long> {

}
