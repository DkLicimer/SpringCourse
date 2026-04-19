class BaseAgent:
    """Базовый класс для всех интеллектуальных агентов."""
    def __init__(self, name, event_bus):
        self.name = name
        self.event_bus = event_bus

    def log(self, message):
        """Единый формат логирования для агентов."""
        print(f"[АГЕНТ: {self.name}] {message}")