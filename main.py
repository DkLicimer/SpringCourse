import os
import sys

# Добавляем пути
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from src.data_acquisition.data_collector import DataCollector
from src.data_acquisition.preprocessor import DataPreprocessor
from src.time_series_prediction.trainer import ModelTrainer
from src.fault_detection.anomaly_detector import AnomalyDetector
from src.fault_rule_extraction.rule_miner import RuleMiner
from src.multi_agent_system.agent_platform import MASPlatform

def main():
    print("="*60)
    print(" ЗАПУСК СИСТЕМЫ ИНТЕЛЛЕКТУАЛЬНОЙ ДИАГНОСТИКИ ОТКАЗОВ (MAS) ")
    print("="*60)

    # ЭТАП 1: Сбор и симуляция данных
    print("\n>>> ЭТАП 1: Сбор и подготовка данных")
    collector = DataCollector()
    collector.generate_normal_data()
    collector.inject_anomalies()
    collector.save_data()

    preprocessor = DataPreprocessor()
    preprocessor.run()

    # ЭТАП 2: Обучение модели прогнозирования временных рядов (LSTM)
    print("\n>>> ЭТАП 2: Обучение нейросети (LSTM)")
    # Если вы не хотите каждый раз ждать обучения при показе проекта, 
    # можно закомментировать следующие 3 строки, если модель уже есть в data/models/
    # trainer = ModelTrainer()
    # trainer.load_and_prepare_data()
    # trainer.train()
    print("Обучение пропущено (используется сохраненная модель).")

    # ЭТАП 3: Обнаружение аномалий
    print("\n>>> ЭТАП 3: Поиск аномалий во временных рядах")
    detector = AnomalyDetector()
    detector.run_detection()

    # ЭТАП 4: Извлечение правил отказов (Data Mining)
    print("\n>>> ЭТАП 4: Извлечение правил отказов (Алгоритм Apriori)")
    miner = RuleMiner()
    miner.load_and_prepare_data()
    miner.extract_rules()
    miner.save_rules()

    # ЭТАП 5: Запуск Мультиагентной Системы
    print("\n>>> ЭТАП 5: Запуск Мультиагентной Системы (МАС)")
    platform = MASPlatform()
    platform.setup_agents()
    
    # Запускаем симуляцию
    try:
        platform.run_simulation()
    except KeyboardInterrupt:
        print("\nСимуляция остановлена пользователем.")
        
    print("\n" + "="*60)
    print(" РАБОТА СИСТЕМЫ УСПЕШНО ЗАВЕРШЕНА ")
    print("="*60)

if __name__ == "__main__":
    main()