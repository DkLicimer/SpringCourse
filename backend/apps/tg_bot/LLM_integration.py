from gigachat import GigaChat
from gigachat.models import Chat, Messages, MessagesRole
import os
from dotenv import load_dotenv
import json
load_dotenv()

class GigaChatIntegration:
    def __init__(self):
        # Получаем credentials из переменных окружения
        credentials = os.getenv("GIGACHAT_CREDENTIALS")
        if not credentials:
            raise ValueError("GIGACHAT_CREDENTIALS не установлен в .env файле")

        self.client = GigaChat(
            credentials=credentials,
            scope="GIGACHAT_API_PERS",
            verify_ssl_certs=False  # Только для тестов!
        )
        self.system_prompt = "Тебе надо вернуть данные из json. Важно венуть данные полностью, ничего не вырезая" 

    def _read_json_file(self, file_path: str) -> str:
        """Читает JSON-файл и возвращает его содержимое в виде строки."""
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                return json.dumps(data, ensure_ascii=False, indent=2)
        except Exception as e:
            raise FileNotFoundError(f"Не удалось прочитать файл {file_path}: {e}")
        
    def get_response(self, json_file_path: str = None) -> str:
        try:
            # Если передан JSON-файл, добавляем его содержимое в сообщение
            if json_file_path:
                json_content = self._read_json_file(json_file_path)

            with self.client as giga:
                chat = Chat(
                    messages=[
                        Messages(role=MessagesRole.SYSTEM, content=self.system_prompt),
                        Messages(role=MessagesRole.USER, content=json_content)
                    ],
                    temperature=0.7,
                    max_tokens=500
                )
                response = giga.chat(chat)
                return response.choices[0].message.content

        except Exception as e:
            print(f"Ошибка GigaChat: {e}")
            return "Произошла ошибка при обработке запроса."