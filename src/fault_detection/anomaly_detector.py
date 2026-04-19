import pandas as pd
import numpy as np
import os
import sys
from tensorflow.keras.models import load_model

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from src import config
from src.fault_detection.threshold_manager import ThresholdManager
from src.time_series_prediction.trainer import ModelTrainer # Используем метод create_sequences

class AnomalyDetector:
    def __init__(self):
        self.processed_data_path = os.path.join(config.PROCESSED_DATA_DIR, 'processed_sensor_data.csv')
        self.model_path = os.path.join(config.MODELS_DIR, 'lstm_predictor.keras')
        self.seq_length = config.SEQUENCE_LENGTH
        self.features = config.SENSOR_NAMES
        self.threshold_manager = ThresholdManager(config.ANOMALY_THRESHOLD_MULTIPLIER)
        
    def run_detection(self):
        print("Загрузка модели прогнозирования...")
        model = load_model(self.model_path)
        
        print("Загрузка всего датасета...")
        df = pd.read_csv(self.processed_data_path)
        data_values = df[self.features].values
        timestamps = df['timestamp'].values
        
        # Подготовка данных (разбивка на окна), так же как при обучении
        trainer = ModelTrainer()
        X, y_true = trainer.create_sequences(data_values)
        
        # Нам нужны временные метки, соответствующие каждому y_true
        # y_true начинает предсказывать с индекса seq_length
        y_timestamps = timestamps[self.seq_length:] 

        print("\nВыполнение предсказаний моделью для всего датасета...")
        y_pred = model.predict(X)
        
        # 1. Считаем абсолютную ошибку предсказания (MAE для каждой точки)
        errors = np.abs(y_true - y_pred)
        
        # 2. Определяем пороги на основе той части данных, где мы ТОЧНО знаем, что все было хорошо
        # При обучении мы брали первые 60% данных (см. trainer.py). Возьмем их же.
        train_size = int(len(df) * 0.6)
        train_errors = errors[:train_size - self.seq_length] # Вычитаем seq_length из-за сдвига окон
        
        thresholds = self.threshold_manager.calculate_thresholds(train_errors, self.features)
        
        # 3. Применяем пороги ко всем данным (включая часть с поломкой)
        print("\nПоиск аномалий...")
        anomalies_log = []
        
        # Создадим DataFrame для сохранения результатов (сглаживание для агентов)
        results_df = pd.DataFrame({'timestamp': y_timestamps})
        
        for idx, sensor in enumerate(self.features):
            sensor_errors = errors[:, idx]
            sensor_threshold = thresholds[sensor]
            
            # Логический массив: True там, где ошибка превысила порог
            is_anomaly = sensor_errors > sensor_threshold
            
            # Сохраняем в DataFrame
            results_df[f'{sensor}_error'] = sensor_errors
            results_df[f'{sensor}_is_anomaly'] = is_anomaly.astype(int)
            
            # Подсчет для вывода
            num_anomalies = np.sum(is_anomaly)
            print(f"[{sensor}] Обнаружено аномалий: {num_anomalies} (из {len(is_anomaly)} точек)")

        # 4. Сохраняем результаты
        results_path = os.path.join(config.PROCESSED_DATA_DIR, 'anomaly_detection_results.csv')
        results_df.to_csv(results_path, index=False)
        print(f"\nРезультаты обнаружения аномалий сохранены в: {results_path}")

if __name__ == "__main__":
    detector = AnomalyDetector()
    detector.run_detection()