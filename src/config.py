# fault_rule_extraction_mas/src/config.py
import os

# Базовые пути
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, '..', 'data')
RAW_DATA_DIR = os.path.join(DATA_DIR, 'raw')
PROCESSED_DATA_DIR = os.path.join(DATA_DIR, 'processed')
MODELS_DIR = os.path.join(DATA_DIR, 'models')
RULES_DIR = os.path.join(DATA_DIR, 'rules')

# Параметры сбора данных
SENSOR_NAMES = ['temperature_sensor_1', 'pressure_sensor_1', 'vibration_sensor_1', 'motor_current_sensor_1']
SAMPLING_RATE_SECONDS = 1 # Сбор данных каждую секунду (для симуляции)
DATA_SIMULATION_LENGTH_HOURS = 24 # Сколько часов данных симулировать для обучения

# Параметры предварительной обработки данных
MISSING_VALUE_STRATEGY = 'interpolate' # 'interpolate', 'mean', 'median', 'drop'
OUTLIER_DETECTION_METHOD = 'iqr' # 'iqr', 'z_score', None
NORMALIZATION_METHOD = 'min_max' # 'min_max', 'standard_scaler', None

# Параметры модели прогнозирования временных рядов
PREDICTION_MODEL_TYPE = 'LSTM' # 'LSTM', 'GRU', 'Transformer', 'ARIMA'
SEQUENCE_LENGTH = 100 # Длина входной последовательности для LSTM/GRU
PREDICTION_HORIZON = 10 # Сколько шагов вперед предсказывать
BATCH_SIZE = 32
EPOCHS = 50
LEARNING_RATE = 0.001

# Параметры обнаружения отказов
ANOMALY_THRESHOLD_MULTIPLIER = 3 # Например, 3 стандартных отклонения от среднего отклонения
ANOMALY_DETECTION_WINDOW = 60 # Размер окна для расчета отклонений (в секундах/точках данных)

# Параметры мультиагентной системы
AGENT_COMMUNICATION_PROTOCOL = 'MQTT' # Или 'DirectCall', 'Queue'
AGENT_HEARTBEAT_INTERVAL_SECONDS = 5

# Параметры извлечения правил отказов
MIN_SUPPORT = 0.1 # Минимальная поддержка для ассоциативных правил
MIN_CONFIDENCE = 0.7 # Минимальная достоверность для ассоциативных правил

# Создаем директории, если они не существуют
for _dir in [RAW_DATA_DIR, PROCESSED_DATA_DIR, MODELS_DIR, RULES_DIR]:
    os.makedirs(_dir, exist_ok=True)