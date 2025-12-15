# file: bot.py
import asyncio
import logging

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode

# --- ИЗМЕНЕНИЕ 1: Убрали admin_group_id из импорта ---
from config import BOT_TOKEN
from handlers import router as main_router

# Настройка логирования
logging.basicConfig(level=logging.INFO)

# Главная функция для запуска бота
async def main():
    # --- ИЗМЕНЕНИЕ 2: Убрали проверку группы (проверяем только токен) ---
    if not BOT_TOKEN:
        logging.critical("!!! ОШИБКА: BOT_TOKEN не установлен в .env файле. Бот не может запуститься.")
        return

    # Инициализация бота и диспетчера
    bot = Bot(
        token=BOT_TOKEN,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML)
    )
    dp = Dispatcher()

    # Подключение главного роутера
    dp.include_router(main_router)

    logging.info("Бот запускается...")

    # Удаление старых вебхуков и запуск поллинга
    await bot.delete_webhook(drop_pending_updates=True)
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())