from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout, Input
import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from src import config

def build_lstm_model(input_shape):
    """
    Создает архитектуру модели LSTM для прогнозирования временных рядов.
    input_shape: tuple (длина_последовательности, количество_признаков)
    """
    model = Sequential([
        Input(shape=input_shape),
        # Первый слой LSTM
        LSTM(64, return_sequences=True),
        Dropout(0.2), # Защита от переобучения
        # Второй слой LSTM
        LSTM(32, return_sequences=False),
        Dropout(0.2),
        # Выходной слой. Количество нейронов равно количеству датчиков,
        # так как мы предсказываем следующее значение для всех датчиков сразу.
        Dense(len(config.SENSOR_NAMES)) 
    ])
    
    # Компилируем модель: оптимизатор Adam, функция потерь - среднеквадратичная ошибка (MSE)
    model.compile(optimizer='adam', loss='mse')
    
    return model