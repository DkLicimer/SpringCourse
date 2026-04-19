class EventBus:
    """Простой внутренний брокер сообщений для обмена данными между агентами."""
    def __init__(self):
        self.subscribers = {}

    def subscribe(self, event_type, callback):
        """Подписка на определенный тип событий."""
        if event_type not in self.subscribers:
            self.subscribers[event_type] = []
        self.subscribers[event_type].append(callback)

    def publish(self, event_type, data):
        """Публикация события. Все подписанные агенты получат данные."""
        if event_type in self.subscribers:
            for callback in self.subscribers[event_type]:
                callback(data)