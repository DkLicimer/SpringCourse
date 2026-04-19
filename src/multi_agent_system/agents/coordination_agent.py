import pandas as pd
import os
import sys
from .base_agent import BaseAgent

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..')))
from src import config

class CoordinationDecisionAgent(BaseAgent):
    def __init__(self, name, event_bus):
        super().__init__(name, event_bus)
        self.rules_path = os.path.join(config.RULES_DIR, 'extracted_fault_rules.csv')
        self.knowledge_base = self.load_rules()
        
        self.event_bus.subscribe('CORRELATION_FOUND_EVENT', self.make_decision)

    def load_rules(self):
        """Загрузка извлеченных дата-майнингом правил из базы знаний."""
        if os.path.exists(self.rules_path):
            rules_df = pd.read_csv(self.rules_path)
            self.log(f"База знаний успешно загружена. Количество правил: {len(rules_df)}")
            return rules_df
        else:
            self.log("ВНИМАНИЕ: Файл с правилами не найден. Агент будет использовать базовую логику.")
            return pd.DataFrame()

    def make_decision(self, data):
        sensors = data['sensors']
        time = data['timestamp']
        
        self.log(f"Получены данные о системном сбое в {time}. Затронуты: {sensors}")
        
        # Превращаем список сработавших датчиков в строку для поиска
        # Сортируем, чтобы порядок не влиял на поиск
        sensors.sort() 
        
        diagnosis_found = False
        
        if not self.knowledge_base.empty:
            # Ищем, есть ли в базе знаний правило, где текущие датчики (antecedents) 
            # ведут к поломке других компонентов (consequents)
            for _, rule in self.knowledge_base.iterrows():
                # Разбиваем условие правила на список и тоже сортируем
                rule_antecedents = sorted([s.strip() for s in rule['antecedents'].split(',')])
                
                # Если датчики из текущего события совпадают с условием правила
                if set(rule_antecedents).issubset(set(sensors)):
                    confidence = round(rule['confidence'] * 100, 1)
                    consequent = rule['consequents']
                    
                    self.log(f">>> ДИАГНОЗ ИЗ БАЗЫ ЗНАНИЙ (Достоверность {confidence}%): <<<")
                    self.log(f"    Паттерн совпадает с известным отказом.")
                    self.log(f"    Ожидается дальнейшее каскадное распространение сбоя на: [{consequent}]")
                    self.log(f"    РЕКОМЕНДАЦИЯ: Проверить систему {consequent} и связанную механику.")
                    diagnosis_found = True
                    break # Выводим наиболее сильное правило и выходим

        # Резервный механизм, если правило не найдено
        if not diagnosis_found:
             self.log(">>> ДИАГНОЗ: Нестандартная комбинация. Требуется ручной анализ паттерна. <<<")
             
        print("-" * 60)