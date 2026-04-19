import pandas as pd
import numpy as np
import os
import sys
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from src import config
from src.time_series_prediction.predictor_model import build_lstm_model

class ModelTrainer:
    def __init__(self):
        self.processed_data_path = os.path.join(config.PROCESSED_DATA_DIR, 'processed_sensor_data.csv')
        self.model_save_path = os.path.join(config.MODELS_DIR, 'lstm_predictor.keras')
        self.seq_length = config.SEQUENCE_LENGTH
        self.features = config.SENSOR_NAMES

    def create_sequences(self, data):
        """
        Преобразует 2D массив данных в 3D массив окон (скользящее окно).
        Для временных рядов: X = данные с t-N по t, Y = данные в t+1
        """
        X = []
        y = []
        for i in range(len(data) - self.seq_length):
            X.append(data[i:(i + self.seq_length)])
            y.append(data[i + self.seq_length]) # Предсказываем следующий шаг
        return np.array(X), np.array(y)

    def load_and_prepare_data(self):
        print("Загрузка обработанных данных...")
        df = pd.read_csv(self.processed_data_path)
        
        # ВАЖНО: Обучаем только на нормальных данных!
        # Мы знаем, что в нашем синтетическом датасете аномалия начинается на 70%.
        # Чтобы не дать модели "подсмотреть" поломку, возьмем для обучения первые 60% данных.
        train_size = int(len(df) * 0.6)
        train_df = df.iloc[:train_size]
        
        print(f"Размер обучающей выборки: {len(train_df)} строк (только нормальные данные)")
        
        # Извлекаем только значения датчиков (numpy массив)
        data_values = train_df[self.features].values
        
        print("Формирование временных последовательностей (окон)...")
        self.X_train, self.y_train = self.create_sequences(data_values)
        
        # Выделим 10% от обучающей выборки для валидации в процессе обучения
        val_split = int(len(self.X_train) * 0.9)
        self.X_val = self.X_train[val_split:]
        self.y_val = self.y_train[val_split:]
        self.X_train = self.X_train[:val_split]
        self.y_train = self.y_train[:val_split]
        
        print(f"Размерность X_train: {self.X_train.shape}")
        print(f"Размерность y_train: {self.y_train.shape}")

    def train(self):
        input_shape = (self.X_train.shape[1], self.X_train.shape[2]) # (seq_length, num_sensors)
        model = build_lstm_model(input_shape)
        model.summary()
        
        # Настраиваем коллбэки
        # EarlyStopping: остановит обучение, если ошибка на валидации перестанет падать
        # ModelCheckpoint: будет сохранять лучшую версию модели
        callbacks = [
            EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True),
            ModelCheckpoint(self.model_save_path, monitor='val_loss', save_best_only=True)
        ]
        
        print("\nНачало обучения модели...")
        history = model.fit(
            self.X_train, self.y_train,
            epochs=config.EPOCHS,
            batch_size=config.BATCH_SIZE,
            validation_data=(self.X_val, self.y_val),
            callbacks=callbacks,
            verbose=1
        )
        print(f"\nОбучение завершено! Лучшая модель сохранена в: {self.model_save_path}")

if __name__ == "__main__":
    trainer = ModelTrainer()
    trainer.load_and_prepare_data()
    trainer.train()