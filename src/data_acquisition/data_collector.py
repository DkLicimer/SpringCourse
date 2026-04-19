import numpy as np
import pandas as pd
import os
import sys
from datetime import datetime, timedelta

# Добавляем корневую директорию в путь, чтобы импортировать config
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from src import config

class DataCollector:
    def __init__(self):
        self.sensor_names = config.SENSOR_NAMES
        self.sampling_rate = config.SAMPLING_RATE_SECONDS
        self.duration_hours = config.DATA_SIMULATION_LENGTH_HOURS
        self.total_samples = int((self.duration_hours * 3600) / self.sampling_rate)
        self.data = pd.DataFrame()

    def generate_normal_data(self):
        """Генерирует нормальные рабочие данные с шумом и базовыми трендами."""
        print(f"Генерация {self.total_samples} строк нормальных данных...")
        
        # Создаем временную шкалу
        start_time = datetime.now()
        timestamps = [start_time + timedelta(seconds=i*self.sampling_rate) for i in range(self.total_samples)]
        self.data['timestamp'] = timestamps

        time_axis = np.linspace(0, 100, self.total_samples)

        # Симуляция температуры (медленные колебания + небольшой шум)
        self.data['temperature_sensor_1'] = 60 + 5 * np.sin(time_axis * 0.1) + np.random.normal(0, 0.5, self.total_samples)
        
        # Симуляция давления (стабильное + средний шум)
        self.data['pressure_sensor_1'] = 101.3 + np.random.normal(0, 1.0, self.total_samples)
        
        # Симуляция вибрации (высокочастотные колебания вокруг базового уровня)
        self.data['vibration_sensor_1'] = 0.5 + 0.1 * np.sin(time_axis * 50) + np.random.normal(0, 0.05, self.total_samples)
        
        # Симуляция тока мотора (зависит от "нагрузки", имитируем синусоидой)
        self.data['motor_current_sensor_1'] = 15 + 2 * np.sin(time_axis * 0.5) + np.random.normal(0, 0.2, self.total_samples)
        
        # Искусственно добавим немного пропущенных значений для тестирования препроцессора
        missing_indices = np.random.choice(self.total_samples, size=int(self.total_samples * 0.01), replace=False)
        self.data.loc[missing_indices, 'temperature_sensor_1'] = np.nan

    def inject_anomalies(self):
        """Внедряет паттерны отказов в данные для последующего обнаружения."""
        print("Внедрение аномалий (симуляция отказа подшипника)...")
        
        # Точка отказа (примерно на 70% времени симуляции)
        fault_start_idx = int(self.total_samples * 0.7)
        fault_duration = min(2000, self.total_samples - fault_start_idx)
        fault_end_idx = fault_start_idx + fault_duration

        # 1. Скачок вибрации (происходит сразу)
        vibration_spike = np.linspace(0, 3.0, fault_duration) # Вибрация резко и линейно растет
        self.data.loc[fault_start_idx:fault_end_idx-1, 'vibration_sensor_1'] += vibration_spike

        # 2. Рост температуры (начинается чуть позже из-за трения)
        temp_drift_start = fault_start_idx + 300 # Задержка в 300 секунд
        if temp_drift_start < fault_end_idx:
            drift_duration = fault_end_idx - temp_drift_start
            temp_drift = np.linspace(0, 15.0, drift_duration) # Температура вырастает на 15 градусов
            self.data.loc[temp_drift_start:fault_end_idx-1, 'temperature_sensor_1'] += temp_drift
            
        # 3. Скачок тока мотора (мотору тяжелее крутиться)
        current_spike = np.random.normal(5, 1, fault_duration)
        self.data.loc[fault_start_idx:fault_end_idx-1, 'motor_current_sensor_1'] += current_spike
        
        # Добавим колонку с меткой истинной аномалии (для оценки качества алгоритмов позже)
        self.data['is_fault'] = 0
        self.data.loc[fault_start_idx:fault_end_idx-1, 'is_fault'] = 1

    def save_data(self):
        """Сохраняет сырые данные в CSV."""
        file_path = os.path.join(config.RAW_DATA_DIR, 'simulated_sensor_data.csv')
        self.data.to_csv(file_path, index=False)
        print(f"Сырые данные успешно сохранены в: {file_path}")

if __name__ == "__main__":
    collector = DataCollector()
    collector.generate_normal_data()
    collector.inject_anomalies()
    collector.save_data()