from .base_agent import BaseAgent
import pandas as pd

class CorrelationAgent(BaseAgent):
    def __init__(self, name, event_bus, time_window_seconds=600): # окно корреляции 10 минут
        super().__init__(name, event_bus)
        self.time_window_seconds = time_window_seconds
        self.recent_anomalies = []
        
        # Подписываемся на события от агентов мониторинга
        self.event_bus.subscribe('SENSOR_ANOMALY_EVENT', self.handle_anomaly_event)

    def handle_anomaly_event(self, data):
        timestamp = pd.to_datetime(data['timestamp'])
        sensor = data['sensor']
        
        self.recent_anomalies.append({'timestamp': timestamp, 'sensor': sensor})
        self.check_for_correlations(timestamp)

    def check_for_correlations(self, current_time):
        """Ищет аномалии от РАЗНЫХ датчиков в пределах временного окна."""
        # Очищаем старые аномалии из памяти
        cutoff_time = current_time - pd.Timedelta(seconds=self.time_window_seconds)
        self.recent_anomalies = [a for a in self.recent_anomalies if a['timestamp'] >= cutoff_time]

        # Смотрим, какие датчики сейчас шумят
        affected_sensors = set([a['sensor'] for a in self.recent_anomalies])
        
        if len(affected_sensors) > 1:
            # Нашли корреляцию! Несколько датчиков сбоят одновременно.
            sensors_str = ", ".join(affected_sensors)
            self.log(f"=== ОБНАРУЖЕНА КОРРЕЛЯЦИЯ! === Взаимосвязанные аномалии на датчиках: {sensors_str}")
            
            correlation_data = {
                'timestamp': current_time.strftime('%Y-%m-%d %H:%M:%S'),
                'sensors': list(affected_sensors)
            }
            # Сообщаем главному агенту
            self.event_bus.publish('CORRELATION_FOUND_EVENT', correlation_data)
            
            # Очищаем список, чтобы не спамить одно и то же событие каждую секунду
            self.recent_anomalies.clear()