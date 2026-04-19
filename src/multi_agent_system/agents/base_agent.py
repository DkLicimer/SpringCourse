class BaseAgent:
    """Базовый класс для всех интеллектуальных агентов."""
    
    # Статическая переменная для перехвата логов в UI (Streamlit)
    ui_log_callback = None 

    def __init__(self, name, event_bus):
        self.name = name
        self.event_bus = event_bus

    def log(self, message):
        """Единый формат логирования для агентов."""
        msg = f"[АГЕНТ: {self.name}] {message}"
        print(msg) # Оставляем вывод в консоль
        
        # Если подключен интерфейс (UI), отправляем сообщение туда
        if BaseAgent.ui_log_callback:
            BaseAgent.ui_log_callback(msg)