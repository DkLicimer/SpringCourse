import numpy as np

class ThresholdManager:
    def __init__(self, multiplier):
        self.multiplier = multiplier # Берется из config.ANOMALY_THRESHOLD_MULTIPLIER
        self.thresholds = {}

    def calculate_thresholds(self, prediction_errors, sensor_names):
        """
        Вычисляет статический порог аномалии для каждого датчика.
        prediction_errors: numpy массив ошибок предсказания на НОРМАЛЬНЫХ данных
                           размерность (кол-во семплов, кол-во датчиков)
        sensor_names: список имен датчиков
        """
        print("\n--- Расчет порогов аномалий на основе нормальных данных ---")
        for idx, sensor in enumerate(sensor_names):
            sensor_errors = prediction_errors[:, idx]
            
            # Считаем среднее (mean) и стандартное отклонение (std) ошибки для этого датчика
            mean_err = np.mean(sensor_errors)
            std_err = np.std(sensor_errors)
            
            # Порог = Среднее + (Множитель * Стандартное отклонение)
            # Если ошибка превысит это значение, мы считаем это аномалией
            threshold = mean_err + (self.multiplier * std_err)
            
            self.thresholds[sensor] = threshold
            print(f"[{sensor}] Средняя ошибка: {mean_err:.5f}, Std: {std_err:.5f} -> Порог установлен на: {threshold:.5f}")
        
        return self.thresholds

    def get_thresholds(self):
        return self.thresholds