import telebot

from core.local_settings import TELEGRAM_TOKEN, TELEGRAM_CHAT_ID, TELEGRAM_THEME_ID


class TelegramBoot:

    @staticmethod
    def send_text(text: str):
        bot = telebot.TeleBot(TELEGRAM_TOKEN, parse_mode='HTML')
        chat_id = TELEGRAM_CHAT_ID
        message_thread_id = TELEGRAM_THEME_ID

        try:
            bot.send_message(chat_id=chat_id, message_thread_id=message_thread_id, text=text)
        except Exception as e:
            print(f"Бот не смог отправить сообщение {chat_id} - {e}")

