import pandas as pd
import os
import sys
from mlxtend.frequent_patterns import apriori, association_rules

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from src import config

class RuleMiner:
    def __init__(self):
        self.anomalies_path = os.path.join(config.PROCESSED_DATA_DIR, 'anomaly_detection_results.csv')
        self.rules_save_path = os.path.join(config.RULES_DIR, 'extracted_fault_rules.csv')
        # Группируем аномалии по 5 минут, чтобы найти те, что происходят "одновременно"
        self.time_window = '5min' 

    def load_and_prepare_data(self):
        print("Загрузка данных об аномалиях для майнинга правил...")
        df = pd.read_csv(self.anomalies_path, parse_dates=['timestamp'])
        df.set_index('timestamp', inplace=True)

        # Оставляем только колонки с флагами аномалий
        anomaly_cols = [col for col in df.columns if '_is_anomaly' in col]
        df_anomalies = df[anomaly_cols]

        print(f"Разбивка данных на временные окна ({self.time_window})...")
        # Агрегируем данные: если в 5-минутном окне была хотя бы 1 аномалия, ставим 1
        transactions = df_anomalies.resample(self.time_window).max()
        
        # Убираем "пустые" периоды (где все работало штатно)
        # Нас интересуют только те моменты, где что-то ломалось
        transactions = transactions[(transactions.T != 0).any()]
        
        # Приводим к булевому типу (требование mlxtend)
        self.transactions = transactions.astype(bool)
        print(f"Сформировано {len(self.transactions)} транзакций (событий сбоев) для анализа.")

    def extract_rules(self):
        print("\nЗапуск алгоритма Apriori для поиска частых наборов...")
        # Ищем комбинации датчиков, которые сбоят вместе как минимум в 5% случаев (support)
        frequent_itemsets = apriori(self.transactions, min_support=0.05, use_colnames=True)
        
        if frequent_itemsets.empty:
            print("Частые наборы не найдены. Попробуйте снизить min_support.")
            return

        print("Извлечение ассоциативных правил (If -> Then)...")
        # Генерируем правила с достоверностью (confidence) не менее 50%
        rules = association_rules(frequent_itemsets, metric="confidence", min_threshold=0.5)
        
        # Очистка и форматирование названий датчиков для читаемости
        rules['antecedents'] = rules['antecedents'].apply(lambda x: ', '.join(list(x)).replace('_is_anomaly', ''))
        rules['consequents'] = rules['consequents'].apply(lambda x: ', '.join(list(x)).replace('_is_anomaly', ''))
        
        # Оставляем только нужные колонки и сортируем по достоверности (уверенности в правиле)
        final_rules = rules[['antecedents', 'consequents', 'support', 'confidence', 'lift']]
        final_rules = final_rules.sort_values(by='confidence', ascending=False)
        
        self.rules = final_rules
        
        print("\n=== Извлеченные правила (Топ-5) ===")
        print(self.rules.head())

    def save_rules(self):
        if hasattr(self, 'rules') and not self.rules.empty:
            self.rules.to_csv(self.rules_save_path, index=False)
            print(f"\nБаза знаний (правила) успешно сохранена в: {self.rules_save_path}")

if __name__ == "__main__":
    miner = RuleMiner()
    miner.load_and_prepare_data()
    miner.extract_rules()
    miner.save_rules()