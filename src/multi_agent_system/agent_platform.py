import pandas as pd
import time
import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from src import config
from src.multi_agent_system.communication_manager import EventBus
from src.multi_agent_system.agents.data_monitoring_agent import DataMonitoringAgent
from src.multi_agent_system.agents.correlation_agent import CorrelationAgent
from src.multi_agent_system.agents.coordination_agent import CoordinationDecisionAgent

class MASPlatform:
    def __init__(self):
        self.results_path = os.path.join(config.PROCESSED_DATA_DIR, 'anomaly_detection_results.csv')
        self.event_bus = EventBus()
        self.sensor_agents = []
        
    def setup_agents(self):
        print("Инициализация Мультиагентной Системы...")
        
        # 1. Создаем агентов мониторинга для каждого датчика
        for sensor in config.SENSOR_NAMES:
            agent = DataMonitoringAgent(f"Monitor_{sensor}", self.event_bus, sensor)
            self.sensor_agents.append(agent)
            
        # 2. Создаем агента корреляции
        self.correlation_agent = CorrelationAgent("Analyzer_Hub", self.event_bus)
        
        # 3. Создаем главного агента принятия решений
        self.coordination_agent = CoordinationDecisionAgent("Decision_Maker_CEO", self.event_bus)
        
        print("Все агенты успешно развернуты и подключены к EventBus.\n" + "="*50)

    def run_simulation(self, sleep_time=0.0, max_rows=None, progress_callback=None):
        print(f"Загрузка результатов детектирования: {self.results_path}")
        df = pd.read_csv(self.results_path)
        
        if max_rows:
            df = df.head(max_rows)
            
        total_rows = len(df)
        print("Запуск симуляции потока данных...\n")
        
        # Проходим по каждой строке (моменту времени)
        for index, row in df.iterrows():
            timestamp = row['timestamp']
            
            # Передаем данные соответствующим агентам мониторинга
            for idx, sensor in enumerate(config.SENSOR_NAMES):
                anomaly_col_name = f"{sensor}_is_anomaly" 
                is_anomaly = row[anomaly_col_name]
                self.sensor_agents[idx].process_data_point(timestamp, is_anomaly)
                
            # Обновляем прогресс-бар в UI, если он передан
            if progress_callback:
                progress_callback(index + 1, total_rows)
                
            # Задержка для визуализации в интерфейсе
            if sleep_time > 0:
                time.sleep(sleep_time) 

if __name__ == "__main__":
    platform = MASPlatform()
    platform.setup_agents()
    platform.run_simulation()