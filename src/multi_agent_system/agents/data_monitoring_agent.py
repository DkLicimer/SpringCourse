from .base_agent import BaseAgent

class DataMonitoringAgent(BaseAgent):
    def __init__(self, name, event_bus, sensor_name):
        super().__init__(name, event_bus)
        self.sensor_name = sensor_name
        self.is_currently_anomalous = False

    def process_data_point(self, timestamp, is_anomaly):
        """Обработка одной точки данных (имитация потока времени)."""
        if is_anomaly == 1 and not self.is_currently_anomalous:
            # Обнаружено начало аномалии!
            self.is_currently_anomalous = True
            event_data = {
                'timestamp': timestamp,
                'sensor': self.sensor_name,
                'status': 'ANOMALY_STARTED'
            }
            self.log(f"Зафиксирована аномалия в {timestamp}! Отправка оповещения...")
            self.event_bus.publish('SENSOR_ANOMALY_EVENT', event_data)
            
        elif is_anomaly == 0 and self.is_currently_anomalous:
            # Аномалия закончилась
            self.is_currently_anomalous = False
            self.log(f"Показатели вернулись в норму в {timestamp}.")