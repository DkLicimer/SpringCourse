# src/data_acquisition/preprocessor.py
import pandas as pd
from sklearn.preprocessing import MinMaxScaler, StandardScaler
import os
import sys
import joblib

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from src import config

class DataPreprocessor:
    def __init__(self):
        self.raw_data_path = os.path.join(config.RAW_DATA_DIR, 'simulated_sensor_data.csv')
        self.processed_data_path = os.path.join(config.PROCESSED_DATA_DIR, 'processed_sensor_data.csv')
        self.scaler_path = os.path.join(config.MODELS_DIR, 'data_scaler.pkl')
        
        if config.NORMALIZATION_METHOD == 'min_max':
            self.scaler = MinMaxScaler()
        elif config.NORMALIZATION_METHOD == 'standard_scaler':
            self.scaler = StandardScaler()
        else:
            self.scaler = None

    def load_data(self):
        print(f"Загрузка сырых данных из {self.raw_data_path}...")
        self.df = pd.read_csv(self.raw_data_path, parse_dates=['timestamp'])
        
    def handle_missing_values(self):
        print(f"Обработка пропущенных значений методом: {config.MISSING_VALUE_STRATEGY}...")
        
        # Исключаем колонки времени и меток из обработки пропусков
        features = config.SENSOR_NAMES
        
        if config.MISSING_VALUE_STRATEGY == 'interpolate':
            self.df[features] = self.df[features].interpolate(method='linear')
        elif config.MISSING_VALUE_STRATEGY == 'mean':
            self.df[features] = self.df[features].fillna(self.df[features].mean())
        elif config.MISSING_VALUE_STRATEGY == 'drop':
            self.df = self.df.dropna(subset=features)
            
        # Заполняем оставшиеся NaN нулями (если интерполяция не сработала в начале ряда)
        self.df[features] = self.df[features].fillna(0)

    def scale_features(self):
        if self.scaler is None:
            print("Масштабирование отключено в конфиге.")
            return

        print(f"Масштабирование признаков методом: {config.NORMALIZATION_METHOD}...")
        features = config.SENSOR_NAMES
        
        # Масштабируем только значения датчиков
        self.df[features] = self.scaler.fit_transform(self.df[features])
        
        # Сохраняем объект scaler, он понадобится нам при тестировании/предсказании в реальном времени!
        joblib.dump(self.scaler, self.scaler_path)
        print(f"Объект масштабирования сохранен в: {self.scaler_path}")

    def save_processed_data(self):
        self.df.to_csv(self.processed_data_path, index=False)
        print(f"Предобработанные данные сохранены в: {self.processed_data_path}")

    def run(self):
        self.load_data()
        self.handle_missing_values()
        self.scale_features()
        self.save_processed_data()

if __name__ == "__main__":
    preprocessor = DataPreprocessor()
    preprocessor.run()