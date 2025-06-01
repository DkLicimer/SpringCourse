from telegram import Update, ReplyKeyboardMarkup
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes, ConversationHandler
from PALENO_telegrm_logic import handle_message
import asyncio
import nest_asyncio

nest_asyncio.apply()


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    await update.message.reply_text(f"Привет!!!!")

async def handle_text(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    message = update.message.text
    response = handle_message(message)  # No await if it's not async
    await update.message.reply_text(response)  # Send response back
    

def run_PALENO_telegram_bot() -> None:
    TOKEN = "7877864764:AAE1Ba5mRXvjmVInc93CyfYtda2szWWBzfM"
    application = Application.builder().token(TOKEN).build()
    
    # Настройка ConversationHandler для регистрации
    application.add_handler(CommandHandler("start", start))  # Добавьте эту строку!
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text))
    application.run_polling()