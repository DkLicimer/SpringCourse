import logging
import telegram
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import (
    Application,
    CommandHandler,
    CallbackQueryHandler,
    CallbackContext,
)

# Настройка логирования
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO
)
logger = logging.getLogger(__name__)

TEST_DATA = [
    {
        'question': "Какой самый большой океан на Земле?",
        'options': ["Атлантический", "Индийский", "Северный Ледовитый", "Тихий"],
        'correct_option': 3, # Индекс 3 соответствует "Тихий"
    },
    {
        'question': "Какая планета Солнечной системы известна как 'Красная планета'?",
        'options': ["Венера", "Марс", "Юпитер", "Сатурн"],
        'correct_option': 1, # Индекс 1 соответствует "Марс"
    },
    {
        'question': "Кто написал 'Война и мир'?",
        'options': ["Фёдор Достоевский", "Антон Чехов", "Лев Толстой", "Иван Тургенев"],
        'correct_option': 2, # Индекс 2 соответствует "Лев Толстой"
    },
    {
        'question': "Сколько континентов на Земле?",
        'options': ["4", "5", "6", "7"],
        'correct_option': 3, # Индекс 3 соответствует "7" (Африка, Антарктида, Азия, Австралия, Европа, Северная Америка, Южная Америка)
    },
]

user_states = {}
subscribers = set()

def get_question_keyboard(question_index):
    """Создает клавиатуру для вопроса"""
    if question_index < 0 or question_index >= len(TEST_DATA):
        return None

    question_data = TEST_DATA[question_index]
    keyboard = [
        [InlineKeyboardButton(option, callback_data=f"q{question_index}_a{i}")]
        for i, option in enumerate(question_data['options'])
    ]
    return InlineKeyboardMarkup(keyboard)

async def send_question(chat_id, question_index, context: CallbackContext):
    """Отправляет вопрос пользователю"""
    if question_index < 0 or question_index >= len(TEST_DATA):
        await context.bot.send_message(chat_id=chat_id, text="Произошла ошибка при загрузке вопроса.")
        return

    question_data = TEST_DATA[question_index]
    keyboard = get_question_keyboard(question_index)

    try:
        await context.bot.send_message(
            chat_id=chat_id,
            text=f"Вопрос {question_index + 1}/{len(TEST_DATA)}:\n{question_data['question']}",
            reply_markup=keyboard
        )
    except telegram.error.TelegramError as e:
        if "bot was blocked by the user" in str(e):
            subscribers.discard(chat_id)
            user_states.pop(chat_id, None)

async def setup_test_handlers(application: Application):
    """Регистрирует обработчики тестов"""
    application.add_handler(CommandHandler("start_test_broadcast", start_test_broadcast))
    application.add_handler(CallbackQueryHandler(handle_answer))

async def start_test_broadcast(update: Update, context: CallbackContext) -> None:
    """Запускает рассылку теста"""
    if not subscribers:
        await update.message.reply_text("Нет подписчиков для рассылки.")
        return

    await update.message.reply_text(f"Запускаю рассылку теста для {len(subscribers)} подписчиков...")

    for subscriber_id in list(subscribers):
        user_states[subscriber_id] = {'question_index': 0, 'score': 0}
        await send_question(subscriber_id, 0, context)

async def handle_answer(update: Update, context: CallbackContext) -> None:
    """Обрабатывает ответы на вопросы"""
    query = update.callback_query
    await query.answer()
    
    chat_id = query.message.chat_id
    if chat_id not in user_states:
        await query.edit_message_text("Тест неактивен.")
        return

    try:
        callback_data = query.data
        parts = callback_data.split('_')
        question_index = int(parts[0][1:])
        selected_option = int(parts[1][1:])
        
        state = user_states[chat_id]
        if question_index != state['question_index']:
            await query.edit_message_text("Вы уже ответили на этот вопрос.")
            return

        # Проверка ответа
        question = TEST_DATA[question_index]
        question = TEST_DATA[question_index]
        if selected_option == question['correct_option']:
            state['score'] += 1
            feedback = "✅ Верно!"
        else:
            feedback = f"❌ Неверно. Правильный ответ: {question['options'][question['correct_option']]}"

        await query.edit_message_text(
            text=f"{question['question']}\n\nВаш ответ: {question['options'][selected_option]}\n{feedback}",
            reply_markup=None
            )

        # Переход к следующему вопросу
        state['question_index'] += 1
        if state['question_index'] < len(TEST_DATA):
            await send_question(chat_id, state['question_index'], context)
        else:
            await context.bot.send_message(
                chat_id=chat_id,
                text=f"Тест завершен! Ваш счет: {state['score']}/{len(TEST_DATA)}"
            )
            del user_states[chat_id]

    except Exception as e:
        logger.error(f"Ошибка обработки ответа: {e}")
        await query.edit_message_text("Произошла ошибка.")