# main.py

from threading import Thread
from telegram_bot import run_bot
import uvicorn
from api import app
import db # Импортируем модуль базы данных
import logging

# Настройка логирования для main
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def run_fastapi():
    logger.info("FastAPI starting...")
    # Инициализацию DB лучше делать в main, а не в каждом сервисе
    # db.init_db()
    # db.populate_surveys()
    uvicorn.run(app, host="0.0.0.0", port=8000)
    logger.info("FastAPI stopped.")

def run_telegram_bot():
     logger.info("Telegram bot starting...")
     # Инициализацию DB лучше делать в main, а не в каждом сервисе
     # db.init_db()
     # db.populate_surveys()
     run_bot() # run_bot() содержит application.run_polling(), который блокирует поток
     logger.info("Telegram bot stopped.")

if __name__ == "__main__":
    logger.info("Приложение запускается...")

    # Инициализация базы данных и заполнение опросами ПЕРЕД запуском сервисов
    try:
        db.init_db()
        db.migrate_users_from_json() # Опционально: миграция старых пользователей
        db.populate_surveys() # Заполнение базы данными опросов
        logger.info("База данных успешно инициализирована и заполнена.")
    except Exception as e:
        logger.error(f"Ошибка при инициализации или заполнении базы данных: {e}", exc_info=True)
        # Если DB не инициализировалась, возможно, нет смысла запускать бот и API
        # exit(1) # Можно завершить программу при ошибке БД


    # Запуск FastAPI в отдельном потоке
    api_thread = Thread(target=run_fastapi, daemon=True) # daemon=True позволит завершить поток при завершении main
    api_thread.start()
    logger.info("Поток FastAPI запущен.")

    # Запуск Telegram бота в отдельном потоке
    # ИСПРАВЛЕНО: Передаем саму функцию, а не результат ее выполнения
    # Добавлен daemon=True
    telegram_thread = Thread(target=run_telegram_bot, daemon=True)
    telegram_thread.start()
    logger.info("Поток Telegram бота запущен.")


    logger.info("API и боты запущены! Нажмите Ctrl+C для остановки.")

    # main поток может оставаться активным, чтобы потоки daemon не завершились сразу
    # или ждать сигналов остановки. Простой join приведет к блокировке main потока.
    # В production используют более сложные механизмы управления процессами (systemd, Docker и т.д.)
    # Для простоты, можем сделать фиктивный цикл ожидания или просто позволить main завершиться,
    # полагаясь на daemon=True, хотя это не самый чистый способ остановки.
    # Более надежный способ: использовать Event для сигнализации остановки потокам.
    try:
        # Ждем завершения одного из потоков (например, если run_bot блокируется)
        # telegram_thread.join()
        # api_thread.join()
        # Или просто ждем прерывания (Ctrl+C)
        while True:
            import time
            time.sleep(1)
    except (KeyboardInterrupt, SystemExit):
        logger.info("Получен сигнал остановки. Завершение...")
        # Здесь может потребоваться более явная остановка потоков, если они не daemon
        # и не реагируют на сигналы. ptb.run_polling() имеет параметр stop_signals
        # и метод stop().

    logger.info("Приложение остановлено.")