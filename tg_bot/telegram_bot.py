# telegram_bot.py

import logging
import telegram
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    CallbackQueryHandler,
    ContextTypes,
    ConversationHandler,
    filters
)
from registration import get_or_create_user
import db
import asyncio
import nest_asyncio

# Настройка логирования
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.DEBUG # Уровень логирования
)
logger = logging.getLogger(__name__)

# --- Состояния для ConversationHandler ---
# NONE - Состояние, когда мы ждем callback от кнопки (для choice вопросов)
# Этот же None является неявным начальным состоянием ConvHandler.
ASKING_TEXT_ANSWER = 1 # Состояние, когда бот ждет текстовый ответ от пользователя


# --- Вспомогательные функции ---

def get_question_keyboard(question_data):
    """Создает клавиатуру для вопроса типа 'choice'."""
    logger.debug(f"get_question_keyboard called for question ID: {question_data.get('id')}")
    if question_data.get("type") == "text":
        # Этот случай не должен происходить, так как эта функция вызывается только для choice
        logger.error(f"get_question_keyboard called for text question ID: {question_data.get('id')}. Returning None.")
        return None

    options = question_data.get("options")
    if not options:
         logger.error(f"У choice вопроса {question_data.get('id')} нет опций. Returning None.")
         return None

    keyboard = [
        # В callback_data сохраняем ID вопроса и index опции
        # session_id и user_id будут получены из context.user_data при обработке ответа
        [InlineKeyboardButton(option['text'], callback_data=f"answer_q{question_data['id']}_o{option['option_index']}")]
        for option in options
    ]
    logger.debug(f"Generated keyboard for question ID {question_data.get('id')}: {keyboard}")
    return InlineKeyboardMarkup(keyboard)


async def send_question(chat_id: int, session_id: int, question_index: int, context: ContextTypes.DEFAULT_TYPE):
    """
    Отправляет вопрос пользователю в рамках сессии.
    Возвращает данные отправленного вопроса (словарь из БД) или None при ошибке.
    """
    logger.debug(f"User {chat_id}: --> Entering send_question. Session ID: {session_id}, Question Index: {question_index}")

    # Получаем ID опросника из сессии (нужно для получения вопросов и их количества)
    conn = db.get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT survey_id, user_id FROM survey_sessions WHERE id = ?", (session_id,))
    session_row = cursor.fetchone()
    conn.close()

    if not session_row:
        logger.error(f"User {chat_id}: Session ID {session_id} not found in DB in send_question. Cannot send question {question_index}.")
        # state в context.user_data мог быть очищен ранее, но на всякий случай
        if context.user_data: context.user_data.clear()
        await context.bot.send_message(chat_id=chat_id, text="Произошла ошибка: Не найдена активная сессия опроса. Попробуйте /start заново.")
        # send_question теперь не решает состояние ConvHandler, просто возвращает None
        logger.debug(f"User {chat_id}: <-- Exiting send_question (session not found), returning None.")
        return None

    survey_id = session_row['survey_id']
    user_id = session_row['user_id'] # Получаем user_id из сессии, чтобы использовать context.user_data
    # Убедимся, что context.user_data содержит актуальные session_id и user_id
    context.user_data['session_id'] = session_id
    context.user_data['user_id'] = user_id
    logger.debug(f"User {chat_id}: Found survey_id {survey_id} and user_id {user_id} for session {session_id}. context.user_data updated: {context.user_data}")


    # Получаем данные вопроса из базы данных по индексу
    question = db.get_question_by_survey_id_and_index(survey_id, question_index)

    if not question:
        logger.error(f"User {chat_id}: Не найден вопрос для survey_id={survey_id} с индексом {question_index} для сессии {session_id}")
        await context.bot.send_message(chat_id=chat_id, text="Произошла ошибка при загрузке следующего вопроса.")
        # При ошибке загрузки вопроса, отменяем сессию и чистим state
        db.cancel_survey_session(session_id)
        logger.debug(f"User {chat_id}: Session {session_id} cancelled due to missing question.")
        if context.user_data: context.user_data.clear()
        # send_question теперь не решает состояние ConvHandler, просто возвращает None
        logger.debug(f"User {chat_id}: <-- Exiting send_question (missing question), returning None.")
        return None

    logger.debug(f"User {chat_id}: Loaded question ID {question['id']} (index {question['question_index']}), type '{question['type']}'")

    # Получаем общее количество вопросов в опросе (для индикатора прогресса)
    total_questions = db.get_question_count_by_survey_id(survey_id)
    if total_questions == 0:
         logger.error(f"User {chat_id}: В опроснике survey_id={survey_id} нет вопросов.")
         await context.bot.send_message(chat_id=chat_id, text="Произошла ошибка: Опрос не содержит вопросов.")
         db.cancel_survey_session(session_id)
         logger.debug(f"User {chat_id}: Session {session_id} cancelled due to zero questions.")
         if context.user_data: context.user_data.clear()
         # send_question теперь не решает состояние ConvHandler, просто возвращает None
         logger.debug(f"User {chat_id}: <-- Exiting send_question (zero questions), returning None.")
         return None

    logger.debug(f"User {chat_id}: Total questions in survey {survey_id}: {total_questions}.")


    # Получаем заголовок опроса для вывода в сообщении
    conn = db.get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT title FROM surveys WHERE id = ?", (survey_id,))
    survey_title_row = cursor.fetchone()
    conn.close()
    survey_title = survey_title_row['title'] if survey_title_row else "Опрос"

    message_text = f"{survey_title}\n\nВопрос {question_index + 1}/{total_questions}:\n{question['text']}"

    try:
        if question.get("type") == "text":
             logger.debug(f"User {chat_id}: Sending text question ID {question['id']} (index {question_index}).")
             await context.bot.send_message(
                chat_id=chat_id,
                text=message_text
            )
             logger.debug(f"User {chat_id}: <-- Exiting send_question, returning question data for TEXT type.")
             return question # Возвращаем данные вопроса
        else: # choice
             keyboard = get_question_keyboard(question) # Клавиатура только для choice
             logger.debug(f"User {chat_id}: Sending choice question ID {question['id']} (index {question_index}).")
             await context.bot.send_message(
                chat_id=chat_id,
                text=message_text,
                reply_markup=keyboard
            )
             logger.debug(f"User {chat_id}: <-- Exiting send_question, returning question data for CHOICE type.")
             return question # Возвращаем данные вопроса

    except telegram.error.TelegramError as e:
        logger.error(f"User {chat_id}: Ошибка отправки сообщения для вопроса {question_index} (ID {question['id']}): {e}", exc_info=True)
        # При ошибке отправки сообщения, отменяем сессию и чистим state
        db.cancel_survey_session(session_id)
        logger.debug(f"User {chat_id}: Session {session_id} cancelled due to Telegram error.")
        if context.user_data: context.user_data.clear()
        # send_question теперь не решает состояние ConvHandler, просто возвращает None
        logger.debug(f"User {chat_id}: <-- Exiting send_question (Telegram error), returning None.")
        return None


async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """
    Обработчик команды /start.
    Проверяет активную сессию в БД и предлагает продолжить или начать новую.
    Не является entry_point ConversationHandler, но может перевести в его состояние.
    """
    chat_id = update.message.chat_id
    logger.debug(f"User {chat_id}: --> Entering start_command.")

    # Получаем или создаем пользователя в DB
    user_id = get_or_create_user(chat_id)
    if user_id is None:
         logger.error(f"User {chat_id}: Не удалось получить или создать пользователя.")
         await update.message.reply_text("Произошла ошибка при регистрации. Попробуйте позже.")
         logger.debug(f"User {chat_id}: <-- Exiting start_command, returning ConversationHandler.END.")
         # Важно вернуть ConversationHandler.END, если start_command может быть вызван
         # во время активной конверсии (например, если ConvHandler.allow_reentry=True)
         # или если мы хотим явно завершить любую потенциальную конверсию при ошибке.
         # Однако, по вашей текущей структуре, /start не является entry_point или fallback,
         # поэтому он просто обрабатывается отдельно. Возврат None тут корректнее,
         # если мы не хотим влиять на ConversationHandler. Но для надежности при ошибке
         # регистрации, завершим ConvHandler на всякий случай.
         return ConversationHandler.END

    logger.info(f"Пользователь {chat_id} (DB ID: {user_id}) использовал /start.")

    # Проверяем, нет ли у пользователя активной сессии в БД
    active_session = db.get_active_survey_session(user_id)

    if active_session:
         logger.info(f"User {chat_id}: Found active session {active_session['id']} (survey_id: {active_session['survey_id']}, current_q_index: {active_session['current_question_index']}). Resuming...")

         # Сохраняем данные сессии во временное хранилище context.user_data
         context.user_data['user_id'] = user_id
         context.user_data['session_id'] = active_session['id']
         logger.debug(f"User {chat_id}: context.user_data set for resume: {context.user_data}")

         # Отправляем сообщение о продолжении
         await update.message.reply_text("У вас есть незавершенный опрос. Продолжаем...")

         # Отправляем текущий вопрос сессии (индекс берем из БД)
         logger.debug(f"User {chat_id}: Calling send_question to resume session {active_session['id']} at index {active_session['current_question_index']}.")
         question_data = await send_question(chat_id, active_session['id'], active_session['current_question_index'], context)

         # Определяем следующее состояние ConvHandler на основе типа отправленного вопроса
         if question_data and question_data.get('type') == 'text':
              logger.debug(f"User {chat_id}: send_question returned TEXT question data. start_command returning ASKING_TEXT_ANSWER.")
              return ASKING_TEXT_ANSWER # Переходим в состояние ожидания текста
         elif question_data:
              logger.debug(f"User {chat_id}: send_question returned CHOICE question data. start_command returning None.")
              return None # Остаемся в неявном состоянии None (ожидание callback)
         else:
             # send_question вернул None, произошла ошибка
             logger.error(f"User {chat_id}: send_question returned None during session resume.")
             # ConvHandler завершится, так как send_question уже позаботился об отмене сессии и очистке context.user_data при ошибке
             return ConversationHandler.END


    else:
        logger.info(f"User {chat_id}: No active session found. Showing survey menu.")
        # Если активной сессии нет, показываем меню выбора опросов
        available_surveys = db.get_all_surveys()
        logger.debug(f"User {chat_id}: Available surveys from DB: {available_surveys}")

        if not available_surveys:
            logger.warning(f"User {chat_id}: Нет доступных опросов в БД.")
            await update.message.reply_text("Извините, сейчас нет доступных опросов.")
            logger.debug(f"User {chat_id}: <-- Exiting start_command (no surveys), returning None.")
            return None # Не влияем на ConvHandler, просто закончили обработку команды

        keyboard = [[InlineKeyboardButton(survey['title'], callback_data=f"start_survey_{survey['key']}")] for survey in available_surveys]
        reply_markup = InlineKeyboardMarkup(keyboard)

        logger.debug(f"User {chat_id}: Sending survey selection menu.")
        await update.message.reply_text("Привет! Я бот для проведения опросов. Выбери опрос, который хочешь пройти:", reply_markup=reply_markup)
        # Возвращаем None. /start не является entry_point ConvHandler.
        # Entry point ждет клика по кнопке 'start_survey_...'.
        logger.debug(f"User {chat_id}: <-- Exiting start_command (showing menu), returning None.")
        return None


async def start_survey_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """
    Обработчик callback query для начала опроса.
    Является entry_point ConversationHandler.
    """
    logger.debug(f"User {update.callback_query.message.chat_id}: --> Entering start_survey_callback. Data: {update.callback_query.data}")
    query = update.callback_query
    await query.answer() # Важно ответить на callback

    chat_id = query.message.chat_id

    # Получаем или создаем пользователя в DB
    user_id = get_or_create_user(chat_id)
    if user_id is None:
         logger.error(f"User {chat_id}: Не удалось получить или создать пользователя в start_survey_callback.")
         await query.edit_message_text("Произошла ошибка при регистрации. Попробуйте /start позже.")
         logger.debug(f"User {chat_id}: <-- Exiting start_survey_callback (user create error), returning ConversationHandler.END")
         return ConversationHandler.END # Завершаем ConvHandler при критической ошибке

    # Проверяем, нет ли уже активной сессии в БД (повторная проверка для entry_points)
    active_session = db.get_active_survey_session(user_id)
    if active_session:
         logger.warning(f"User {chat_id}: Found active session {active_session['id']} in start_survey_callback. User clicked a 'start survey' button while one is active.")
         await query.edit_message_text("У вас уже есть незавершенный опрос. Пожалуйста, завершите его (/cancel) или используйте /start для продолжения текущего.")
         logger.debug(f"User {chat_id}: <-- Exiting start_survey_callback (active session found), returning ConversationHandler.END")
         return ConversationHandler.END # Завершаем текущую попытку ConvHandler

    callback_data = query.data # Например, "start_survey_quality"
    logger.debug(f"User {chat_id}: Parsing callback_data: {callback_data}")
    parts = callback_data.split('_')
    survey_key = parts[-1] # Получаем 'quality' или 'engagement'

    survey = db.get_survey_by_key(survey_key)
    if not survey:
        logger.error(f"User {chat_id}: Попытка начать несуществующий опрос: {survey_key}")
        await query.edit_message_text("Ошибка: Выбранный опрос не найден.")
        logger.debug(f"User {chat_id}: <-- Exiting start_survey_callback (survey not found), returning ConversationHandler.END")
        return ConversationHandler.END

    logger.debug(f"User {chat_id}: Found survey details for key '{survey_key}': {survey}")

    total_questions = db.get_question_count_by_survey_id(survey['id'])
    if total_questions == 0:
         logger.error(f"User {chat_id}: Попытка начать опрос без вопросов: {survey_key} (ID {survey['id']})")
         await query.edit_message_text("Ошибка: В этом опросе пока нет вопросов.")
         logger.debug(f"User {chat_id}: <-- Exiting start_survey_callback (no questions), returning ConversationHandler.END")
         return ConversationHandler.END

    logger.debug(f"User {chat_id}: Total questions in survey {survey['id']}: {total_questions}.")

    # Создаем новую сессию в базе данных. current_question_index в DB будет 0.
    session_id = db.start_survey_session(user_id, survey['id'])
    if session_id is None:
         logger.error(f"User {chat_id} (User ID: {user_id}): Не удалось создать сессию в БД для survey {survey['id']}.")
         await query.edit_message_text("Произошла ошибка при запуске опроса.")
         logger.debug(f"User {chat_id}: <-- Exiting start_survey_callback (DB error), returning ConversationHandler.END")
         return ConversationHandler.END

    logger.info(f"Пользователь {chat_id} (User ID: {user_id}, Session ID: {session_id}) начал опрос: {survey_key}")

    # Сохраняем user_id и session_id в context.user_data для использования в последующих обработчиках
    context.user_data['user_id'] = user_id
    context.user_data['session_id'] = session_id
    logger.debug(f"User {chat_id}: context.user_data initialized: {context.user_data}")


    # Удаляем кнопки выбора опроса из сообщения
    try:
        await query.edit_message_text(f"Начинаем опрос: {survey['title']}")
        logger.debug(f"User {chat_id}: Edited survey selection message.")
    except telegram.error.TelegramError as e:
        logger.warning(f"User {chat_id}: Не удалось отредактировать сообщение выбора опроса: {e}")
        # Не критическая ошибка, просто продолжаем


    # Отправляем первый вопрос (индекс 0)
    logger.debug(f"User {chat_id}: Calling send_question for index 0.")
    question_data = await send_question(chat_id, session_id, 0, context) # send_question теперь возвращает данные вопроса или None

    # Определяем следующее состояние ConvHandler на основе типа отправленного вопроса
    if question_data and question_data.get('type') == 'text':
         logger.debug(f"User {chat_id}: send_question returned TEXT question data. start_survey_callback returning ASKING_TEXT_ANSWER.")
         return ASKING_TEXT_ANSWER # Переходим в состояние ожидания текста
    elif question_data:
         logger.debug(f"User {chat_id}: send_question returned CHOICE question data. start_survey_callback returning None.")
         return None # Остаемся в неявном состоянии None (ожидание callback)
    else:
        # send_question вернул None, произошла ошибка
        logger.error(f"User {chat_id}: send_question returned None during new session start.")
        # ConvHandler завершится, так как send_question уже позаботился об отмене сессии и очистке context.user_data при ошибке
        return ConversationHandler.END


async def handle_button_answer(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """
    Обрабатывает ответы пользователя, присланные через inline кнопки.
    Является fallback ConversationHandler.
    """
    logger.debug(f"User {update.callback_query.message.chat_id}: --> Entering handle_button_answer. Data: {update.callback_query.data}")
    query = update.callback_query
    await query.answer() # Важно ответить на callback

    chat_id = query.message.chat_id

    # Получаем session_id и user_id из context.user_data
    # Если их нет, значит, нет активной сессии, управляемой этим ConvHandler
    if 'session_id' not in context.user_data or 'user_id' not in context.user_data:
        logger.warning(f"User {chat_id}: handle_button_answer called but context.user_data is missing session_id or user_id.")
        await query.edit_message_text("Опрос неактивен или завершен. Напишите /start для начала нового.")
        # Нет активной сессии в context.user_data, пытаться отменить в БД не будем
        logger.debug(f"User {chat_id}: <-- Exiting handle_button_answer (context missing), returning ConversationHandler.END")
        return ConversationHandler.END # Завершаем ConversationHandler

    session_id = context.user_data['session_id']
    user_id = context.user_data['user_id']
    logger.debug(f"User {chat_id}: context.user_data OK. user_id={user_id}, session_id={session_id}")

    # Загружаем текущее состояние сессии из БД, чтобы получить ожидаемый индекс вопроса и survey_id
    active_session = db.get_active_survey_session(user_id)

    # Проверка активной сессии и соответствия session_id
    if not active_session or active_session['id'] != session_id:
         logger.warning(f"User {chat_id} (Session {session_id}): handle_button_answer received callback, but DB session is missing or doesn't match.")
         await query.edit_message_text("Опрос неактивен или завершен. Напишите /start для начала нового.")
         if context.user_data: context.user_data.clear() # Очищаем неактуальное state
         logger.debug(f"User {chat_id}: <-- Exiting handle_button_answer (DB session mismatch), returning ConversationHandler.END")
         return ConversationHandler.END

    # Текущий ожидаемый индекс вопроса из БД и survey_id
    current_expected_question_index = active_session['current_question_index']
    survey_id = active_session['survey_id']
    logger.debug(f"User {chat_id} (Session {session_id}): Current expected question index from DB: {current_expected_question_index}, Survey ID: {survey_id}")


    # Парсим данные из callback_data: "answer_qQUESTIONID_oOPTIONINDEX"
    try:
        callback_data = query.data # Пример: "answer_q123_o2"
        logger.debug(f"User {chat_id}: Parsing callback_data: {callback_data}")
        parts = callback_data.split('_')
        if len(parts) != 3 or parts[0] != "answer" or not parts[1].startswith('q') or not parts[2].startswith('o'):
             logger.warning(f"User {chat_id}: handle_button_answer received unexpected callback data format: {callback_data}. Session: {session_id}")
             await query.edit_message_text("Некорректный формат ответа.")
             try: await query.edit_message_reply_markup(reply_markup=None)
             except telegram.error.TelegramError as e: logger.warning(f"User {chat_id}: Failed to edit message reply markup after incorrect data: {e}")
             logger.debug(f"User {chat_id}: <-- Exiting handle_button_answer (incorrect format), returning None.")
             return None # Остаемся в текущем состоянии ConvHandler (fallback)

        try:
             cb_question_id = int(parts[1][1:]) # q123 -> 123
             cb_selected_option_index = int(parts[2][1:]) # o2 -> 2
             logger.debug(f"User {chat_id}: Parsed: cb_question_id={cb_question_id}, cb_selected_option_index={cb_selected_option_index}")
        except ValueError:
             logger.warning(f"User {chat_id}: handle_button_answer failed to parse IDs/indices from: {callback_data}. Session: {session_id}")
             await query.edit_message_text("Ошибка парсинга данных ответа.")
             try: await query.edit_message_reply_markup(reply_markup=None)
             except telegram.error.TelegramError as e: logger.warning(f"User {chat_id}: Failed to edit message reply markup after parsing error: {e}")
             logger.debug(f"User {chat_id}: <-- Exiting handle_button_answer (parse error), returning None.")
             return None # Остаемся в текущем состоянии


        # Получаем данные вопроса из DB по ID из callback_data
        question = db.get_question_by_survey_id_and_index(survey_id, current_expected_question_index) # Получаем вопрос по ожидаемому индексу
        # Также убедимся, что ID вопроса из callback совпадает с тем, что мы загрузили по индексу
        if not question or question['id'] != cb_question_id:
             # Это может быть старый callback или неконсистентное состояние
             logger.warning(f"User {chat_id} (Session {session_id}): Answer callback Q ID {cb_question_id} or index {question['question_index'] if question else 'N/A'} does not match DB expected index {current_expected_question_index} / actual Q ID {question['id'] if question else 'N/A'}. Ignoring answer.")
             # Отвечаем на callback, но ничего не делаем, т.к. это, вероятно, старый ответ
             await query.answer("Вы уже ответили на этот вопрос или отвечаете на некорректный.") # Отправляем всплывающее уведомление
             logger.debug(f"User {chat_id}: <-- Exiting handle_button_answer (Q Index/ID mismatch), returning None.")
             return None # Остаемся в текущем состоянии ConversationHandler

        logger.debug(f"User {chat_id} (Session {session_id}): Q Index/ID match OK. Processing answer for Q ID {question['id']} (index {question['question_index']}).")


        if question['type'] != 'choice': # Критическая ошибка, если на вопрос типа text пришла кнопка
             logger.warning(f"User {chat_id} (Session {session_id}): Clicked button, but expected question ID {question['id']} (index {question['question_index']}) type is '{question['type']}', expected 'choice'.")
             await query.edit_message_text("Произошла ошибка при обработке ответа (неожиданный тип вопроса для кнопки).")
             db.cancel_survey_session(session_id) # Сбрасываем состояние и отменяем сессию
             if context.user_data: context.user_data.clear()
             logger.debug(f"User {chat_id}: Session {session_id} cancelled & state cleared due to unexpected button type.")
             logger.debug(f"User {chat_id}: <-- Exiting handle_button_answer (incorrect question type), returning ConversationHandler.END")
             return ConversationHandler.END

        # Получаем текст выбранной опции по индексу (нужно для сохранения и вывода)
        conn = db.get_db_connection() # Открываем новое соединение для этой операции
        cursor = conn.cursor()
        cursor.execute("SELECT text FROM options WHERE question_id = ? AND option_index = ?", (question['id'], cb_selected_option_index))
        option_row = cursor.fetchone()
        conn.close() # Закрываем соединение

        if not option_row: # Критическая ошибка, опция не найдена
            logger.error(f"User {chat_id} (Session {session_id}): Option with index {cb_selected_option_index} for question ID {question['id']} not found in DB.")
            await query.edit_message_text("Произошла ошибка при обработке выбранного варианта (опция не найдена).")
            db.cancel_survey_session(session_id) # Сбрасываем состояние и отменяем сессию
            if context.user_data: context.user_data.clear()
            logger.debug(f"User {chat_id}: Session {session_id} cancelled & state cleared due to missing option.")
            logger.debug(f"User {chat_id}: <-- Exiting handle_button_answer (option missing), returning ConversationHandler.END")
            return ConversationHandler.END

        selected_answer_text = option_row['text']
        logger.debug(f"User {chat_id} (Session {session_id}): Selected option text: '{selected_answer_text}'")

        # Сохраняем ответ в базу данных
        db.save_answer(session_id, question['id'], selected_answer_text, cb_selected_option_index)
        logger.info(f"User {chat_id} (Session {session_id}): Saved answer for question ID {question['id']} (index {question['question_index']}), option index {cb_selected_option_index}. Text: '{selected_answer_text}'")

        # Обновляем сообщение с ответом пользователя
        try:
             await query.edit_message_text(
                 text=f"{question['text']}\n\nВаш ответ: {selected_answer_text}",
                 reply_markup=None # Удаляем кнопки после ответа
             )
             logger.debug(f"User {chat_id}: Edited message with answer feedback.")
        except telegram.error.TelegramError as e:
            logger.warning(f"User {chat_id}: Не удалось отредактировать сообщение после сохранения ответа: {e}")
            # Не критическая ошибка, продолжаем


        # Определяем индекс следующего вопроса
        next_question_index = question['question_index'] + 1
        logger.debug(f"User {chat_id} (Session {session_id}): Calculated next question index: {next_question_index}.")

        # Получаем общее количество вопросов в опросе
        total_questions = db.get_question_count_by_survey_id(survey_id)
        logger.debug(f"User {chat_id} (Session {session_id}): Total questions in survey {survey_id}: {total_questions}.")

        if next_question_index < total_questions:
            # Обновляем состояние сессии в БД перед отправкой следующего вопроса
            db.update_session_current_question_index(session_id, next_question_index)
            logger.debug(f"User {chat_id} (Session {session_id}): DB state updated to index {next_question_index}.")

            # Отправляем следующий вопрос
            logger.debug(f"User {chat_id} (Session {session_id}): Calling send_question with question_index {next_question_index}.")
            next_question_data = await send_question(chat_id, session_id, next_question_index, context) # send_question возвращает данные вопроса или None

            # Определяем следующее состояние ConvHandler на основе типа отправленного вопроса
            if next_question_data and next_question_data.get('type') == 'text':
                 logger.debug(f"User {chat_id}: send_question returned TEXT question data. handle_button_answer returning ASKING_TEXT_ANSWER.")
                 return ASKING_TEXT_ANSWER # Переходим в состояние ожидания текста
            elif next_question_data:
                 logger.debug(f"User {chat_id}: send_question returned CHOICE question data. handle_button_answer returning None.")
                 return None # Остаемся в неявном состоянии None (ожидание callback)
            else:
                # send_question вернул None, произошла ошибка при отправке следующего вопроса
                logger.error(f"User {chat_id}: send_question returned None after successful answer to Q{question['question_index']}.")
                # ConvHandler завершится, т.к. send_question уже позаботился об отмене сессии и очистке context.user_data при ошибке
                return ConversationHandler.END

        else:
            # Опрос завершен
            logger.info(f"User {chat_id} (Session {session_id}): All questions answered. Completing survey.")
            db.complete_survey_session(session_id) # Отмечаем сессию как завершенную в DB
            await context.bot.send_message(chat_id=chat_id, text="Опрос завершен! Спасибо за ваши ответы.")
            context.user_data.clear() # Очищаем состояние пользователя из context
            logger.debug(f"User {chat_id}: context.user_data cleared after survey completion.")

            logger.debug(f"User {chat_id}: <-- Exiting handle_button_answer (survey completed), returning ConversationHandler.END")
            return ConversationHandler.END # Завершаем ConversationHandler после завершения опроса

    except Exception as e:
        logger.error(f"User {chat_id}: !!! Uncaught exception in handle_button_answer (Session {session_id}, Data: {query.data}): {e}", exc_info=True) # Логируем детали исключения
        await query.edit_message_text("Произошла непредвиденная ошибка при обработке ответа.")
        # При ошибке, сбрасываем состояние и отменяем сессию
        if 'session_id' in context.user_data:
            db.cancel_survey_session(context.user_data['session_id'])
            logger.debug(f"User {chat_id}: Session {context.user_data['session_id']} cancelled due to uncaught error.")
        if context.user_data:
            context.user_data.clear()
            logger.debug(f"User {chat_id}: context.user_data cleared after uncaught error.")
        logger.debug(f"User {chat_id}: <-- Exiting handle_button_answer (uncaught error), returning ConversationHandler.END")
        return ConversationHandler.END # Завершаем ConversationHandler


async def handle_text_answer(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """
    Обрабатывает текстовые ответы пользователя.
    Находится в состоянии ASKING_TEXT_ANSWER.
    """
    logger.debug(f"User {update.message.chat_id}: --> Entering handle_text_answer. Text: '{update.message.text}'")
    chat_id = update.message.chat_id
    text_answer = update.message.text

    # Получаем session_id и user_id из context.user_data
    if 'session_id' not in context.user_data or 'user_id' not in context.user_data:
         logger.warning(f"User {chat_id}: handle_text_answer called but context.user_data is missing session_id or user_id.")
         await update.message.reply_text("Нет активного опроса, ожидающего текстового ответа. Напишите /start для начала нового.")
         logger.debug(f"User {chat_id}: <-- Exiting handle_text_answer (context missing), returning ConversationHandler.END")
         return ConversationHandler.END # Завершаем ConversationHandler

    session_id = context.user_data['session_id']
    user_id = context.user_data['user_id']
    logger.debug(f"User {chat_id}: context.user_data OK. user_id={user_id}, session_id={session_id}")


    # Загружаем текущее состояние сессии из БД, чтобы получить ожидаемый индекс вопроса и survey_id
    active_session = db.get_active_survey_session(user_id)

    # Проверка активной сессии и соответствия session_id
    if not active_session or active_session['id'] != session_id:
         logger.warning(f"User {chat_id} (Session {session_id}): handle_text_answer received text, but DB session is missing or doesn't match.")
         await update.message.reply_text("Опрос неактивен или завершен. Напишите /start для начала нового.")
         if context.user_data: context.user_data.clear() # Очищаем неактуальное state
         logger.debug(f"User {chat_id}: <-- Exiting handle_text_answer (DB session mismatch), returning ConversationHandler.END")
         return ConversationHandler.END

    # Текущий ожидаемый индекс вопроса из БД и survey_id
    current_expected_question_index = active_session['current_question_index']
    survey_id = active_session['survey_id']
    logger.debug(f"User {chat_id} (Session {session_id}): Current expected question index from DB: {current_expected_question_index}, Survey ID: {survey_id}")


    # Получаем данные вопроса из DB по текущему ожидаемому индексу из БД
    question = db.get_question_by_survey_id_and_index(survey_id, current_expected_question_index)

    if not question: # Критическая ошибка, вопрос из БД не найден по индексу
         logger.error(f"User {chat_id} (Session {session_id}): Current question index {current_expected_question_index} from DB state not found in DB during text answer.")
         await update.message.reply_text("Произошла критическая ошибка при загрузке вопроса.")
         db.cancel_survey_session(session_id)
         if context.user_data: context.user_data.clear()
         logger.debug(f"User {chat_id}: Session {session_id} cancelled & state cleared due to missing question in DB.")
         logger.debug(f"User {chat_id}: <-- Exiting handle_text_answer (DB error, question missing), returning ConversationHandler.END")
         return ConversationHandler.END

    logger.debug(f"User {chat_id} (Session {session_id}): Loaded expected question ID {question['id']} (index {question['question_index']}). Type: '{question['type']}'")


    # Убеждаемся, что текущий вопрос действительно ожидал текст
    if question.get("type") != "text":
         logger.warning(f"User {chat_id} (Session {session_id}): Received text, but expected question ID {question['id']} (index {question['question_index']}) type is '{question['type']}', expected 'text'.")
         # Если пришел текст, когда ожидалась кнопка или другое состояние.
         # Остаемся в состоянии ASKING_TEXT_ANSWER и просим использовать /cancel,
         # так как мы не знаем, куда правильно перейти.
         await update.message.reply_text("Сейчас ожидается текстовый ответ. Если это не то, что вы хотели отправить, пожалуйста, используйте /cancel для отмены опроса.")
         logger.debug(f"User {chat_id}: <-- Exiting handle_text_answer (incorrect question type), returning ASKING_TEXT_ANSWER.")
         return ASKING_TEXT_ANSWER # Остаемся в этом состоянии


    # Сохраняем текстовый ответ в базу данных
    # Для текстового ответа answer_option_index будет NULL
    db.save_answer(session_id, question['id'], text_answer, None)
    logger.info(f"User {chat_id} (Session {session_id}): Saved text answer for question ID {question['id']} (index {question['question_index']}): '{text_answer}'")

    # Определяем индекс следующего вопроса
    next_question_index = question['question_index'] + 1
    logger.debug(f"User {chat_id} (Session {session_id}): Calculated next question index: {next_question_index}.")


    # Получаем общее количество вопросов в опросе
    total_questions = db.get_question_count_by_survey_id(survey_id)
    logger.debug(f"User {chat_id} (Session {session_id}): Total questions in survey {survey_id}: {total_questions}.")


    if next_question_index < total_questions:
        # Обновляем состояние сессии в БД перед отправкой следующего вопроса
        db.update_session_current_question_index(session_id, next_question_index)
        logger.debug(f"User {chat_id} (Session {session_id}): DB state updated to index {next_question_index}.")

        # Отправляем следующий вопрос
        logger.debug(f"User {chat_id} (Session {session_id}): Calling send_question with question_index {next_question_index}.")
        next_question_data = await send_question(chat_id, session_id, next_question_index, context) # send_question возвращает данные вопроса или None

        # Определяем следующее состояние ConvHandler на основе типа отправленного вопроса
        if next_question_data and next_question_data.get('type') == 'text':
             logger.debug(f"User {chat_id}: send_question returned TEXT question data. handle_text_answer returning ASKING_TEXT_ANSWER.")
             return ASKING_TEXT_ANSWER # Переходим в состояние ожидания текста
        elif next_question_data:
             logger.debug(f"User {chat_id}: send_question returned CHOICE question data. handle_text_answer returning None.")
             return None # Переходим в неявное состояние None (ожидание callback)
        else:
             # send_question вернул None, произошла ошибка при отправке следующего вопроса
             logger.error(f"User {chat_id}: send_question returned None after successful answer to Q{question['question_index']}.")
             # ConvHandler завершится
             return ConversationHandler.END

    else:
        # Опрос завершен
        logger.info(f"User {chat_id} (Session {session_id}): All questions answered. Completing survey.")
        db.complete_survey_session(session_id) # Отмечаем сессию как завершенную в DB
        await context.bot.send_message(
            chat_id=chat_id,
            text="Опрос завершен! Спасибо за ваши ответы."
        )
        context.user_data.clear() # Очищаем состояние пользователя из context
        logger.debug(f"User {chat_id}: context.user_data cleared after survey completion.")

        logger.debug(f"User {chat_id}: <-- Exiting handle_text_answer (survey completed), returning ConversationHandler.END")
        return ConversationHandler.END # Завершаем ConversationHandler


async def cancel_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """
    Отменяет текущий активный опрос.
    Может быть вызван в любом состоянии ConversationHandler.
    """
    chat_id = update.message.chat_id
    logger.info(f"User {chat_id} used /cancel command. --> Entering cancel_command.")

    # Проверяем, есть ли session_id в context.user_data
    # Если нет, возможно, ConvHandler не был активен, но проверим БД на всякий случай
    session_id = None
    if 'session_id' in context.user_data:
        session_id = context.user_data['session_id']
    else:
        # Пытаемся найти активную сессию в БД по user_id
        user_id = get_or_create_user(chat_id)
        if user_id:
             active_session = db.get_active_survey_session(user_id)
             if active_session:
                  session_id = active_session['id']

    if session_id:
        db.cancel_survey_session(session_id) # Отмечаем сессию как отмененную в DB
        logger.info(f"User {chat_id} cancelled session {session_id} via /cancel command.")
        if context.user_data: context.user_data.clear() # Очищаем состояние пользователя из context
        logger.debug(f"User {chat_id}: context.user_data cleared.")
        await update.message.reply_text("Активный опрос отменен.")
    else:
        logger.info(f"User {chat_id}: /cancel called, but no active session found.")
        await update.message.reply_text("Нет активного опроса для отмены.")

    # Всегда завершаем ConversationHandler при вызове /cancel
    logger.debug(f"User {chat_id}: <-- Exiting cancel_command, returning ConversationHandler.END")
    return ConversationHandler.END

async def handle_cancel_button(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
     """
     Обрабатывает нажатие кнопки отмены опроса.
     Может быть вызван в любом состоянии ConversationHandler (если кнопка показана).
     """
     logger.debug(f"User {update.callback_query.message.chat_id}: --> Entering handle_cancel_button. Cancel button pressed.")
     query = update.callback_query
     await query.answer() # Важно ответить на callback
     chat_id = query.message.chat_id

     # Проверяем, есть ли session_id в context.user_data
     # Если нет, возможно, ConvHandler не был активен, но проверим БД на всякий случай
     session_id = None
     if 'session_id' in context.user_data:
         session_id = context.user_data['session_id']
     else:
         # Пытаемся найти активную сессию в БД по user_id
         user_id = get_or_create_user(chat_id)
         if user_id:
              active_session = db.get_active_survey_session(user_id)
              if active_session:
                   session_id = active_session['id']


     if session_id:
          db.cancel_survey_session(session_id)
          logger.info(f"User {chat_id} cancelled session {session_id} via button.")
          if context.user_data: context.user_data.clear()
          logger.debug(f"User {chat_id}: context.user_data cleared.")
          try:
               await query.edit_message_text("Опрос отменен по вашему запросу.")
          except telegram.error.TelegramError as e:
               logger.warning(f"User {chat_id}: Failed to edit message after cancel button: {e}")
               # Если не удалось отредактировать, просто отправляем новое сообщение
               await context.bot.send_message(chat_id=chat_id, text="Опрос отменен по вашему запросу.")
     else:
          logger.info(f"User {chat_id}: Cancel button pressed, but no active session found.")
          try:
               await query.edit_message_text("Нет активного опроса для отмены.")
          except telegram.error.TelegramError as e:
               logger.warning(f"User {chat_id}: Failed to edit message after cancel button (no session): {e}")
               # Если не удалось отредактировать, просто отправляем новое сообщение
               await context.bot.send_message(chat_id=chat_id, text="Нет активного опроса для отмены.")


     logger.debug(f"User {chat_id}: <-- Exiting handle_cancel_button, returning ConversationHandler.END")
     return ConversationHandler.END # Завершаем ConversationHandler


# Опционально: Обработчик для любых других сообщений, когда бот НЕ в ConversationHandler
# async def handle_generic_text(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
#      """Универсальный обработчик текстовых сообщений, если они не были перехвачены ConvHandler"""
#      # Этот handler должен быть зарегистрирован ПОСЛЕ ConvHandler
#      # В данном случае, ConvHandler перехватывает все текстовые сообщения в состоянии ASKING_TEXT_ANSWER.
#      # Если бот не в этом состоянии (т.е., в состоянии None), то текст не перехватывается
#      # MessageHandler(filters.TEXT & ~filters.COMMAND, handle_generic_text) в главном диспетчере
#      # будет ловить текст, когда ConversationHandler находится в состоянии None или неактивен.
#      logger.debug(f"User {update.message.chat_id}: --> Entering handle_generic_text. Text: '{update.message.text}'")
#      if update.message and update.message.text:
#          # Проверяем, не является ли пользователь в середине опроса (по context.user_data)
#          # Эта проверка нужна, если handle_generic_text зарегистрирован ДО ConvHandler
#          # или если ConvHandler не настроен перехватывать все сообщения.
#          # В нашей текущей настройке ConvHandler должен перехватывать все, кроме /start.
#          # Этот generic handler может быть лишним или требовать пересмотра.
#          # Оставим его закомментированным, если ConvHandler настроен правильно.
#          # Если вы его раскомментируете, возможно, потребуется добавить его в fallbacks ConvHandler.
#
#          # if 'session_id' in context.user_data:
#          #      await update.message.reply_text("Вы сейчас проходите опрос. Пожалуйста, ответьте на текущий вопрос или используйте /cancel для отмены.")
#          # else:
#          #      await update.message.reply_text("Привет! Я бот для проведения опросов. Используйте /start для выбора опроса.")
#          pass # Ничего не делаем, если ConvHandler не перехватил
#      logger.debug(f"User {update.message.chat_id}: <-- Exiting handle_generic_text.")


def run_bot():
    """Запускает бота"""
    logger.info("run_bot called")

    # !!! ПОМЕНЯЙТЕ НА ВАШ РЕАЛЬНЫЙ ТОКЕН БОТА !!!
    TOKEN = "7566663666:AAH_FredThLmIHX-3NdTa4kN7ooT4q2PRn4" # Ваш токен

    try:
        # nest_asyncio может понадобиться, если run_bot вызывается не в основном потоке
        # или если event loop уже запущен (например, FastAPI в main потоке).
        nest_asyncio.apply()
        logger.info("nest_asyncio applied")
    except Exception as e:
        logger.warning(f"Failed to apply nest_asyncio: {e}")

    try:
        application = Application.builder().token(TOKEN).build()
        logger.info("Telegram Application built.")

        # Определяем ConversationHandler для опросов
        conv_handler = ConversationHandler(
            entry_points=[
                # Вход происходит, когда пользователь нажимает кнопку "Начать опрос..."
                CallbackQueryHandler(start_survey_callback, pattern='^start_survey_.*$'),
                # !!! ДОБАВЛЕНО: Вход также может быть при вызове /start, если есть активная сессия !!!
                # /start теперь должен быть entry_point ИЛИ должен возвращать состояние из своего обработчика.
                # Так как /start также используется для показа меню (не entry point),
                # проще сделать так, что /start *возвращает* состояние ConversationHandler,
                # если он возобновил сессию. ConvHandler.add_handler позволяет это.
                # Оставим /start не в entry_points, но он будет возвращать состояние.
            ],
            states={
                # Состояние 1: Ожидаем текстовый ответ
                ASKING_TEXT_ANSWER: [
                    # Перехватываем любой текст, который НЕ является командой, когда находимся в этом состоянии
                    MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text_answer),
                    # Команды и кнопки отмены могут сработать в любом состоянии через fallbacks, но регистрация их тут тоже не повредит
                    CommandHandler("cancel", cancel_command),
                    CallbackQueryHandler(handle_cancel_button, pattern='^cancel_survey$'),
                 ],
                 # Состояние None (неявное): Ожидаем callback от кнопки choice-вопроса.
                 # Обработчик handle_button_answer для этого состояния зарегистрирован в fallbacks.
            },
            fallbacks=[
                # Этот fallback ловит нажатия кнопок с ответами на choice-вопросы.
                # Он сработает, если бот находится в состоянии None (ожидает callback)
                # или если он в состоянии ASKING_TEXT_ANSWER, но пользователь вдруг нажал кнопку.
                CallbackQueryHandler(handle_button_answer, pattern=r'^answer_q\d+_o\d+$'), # Использована raw string для паттерна
                # Обработчик команды /cancel, который может быть вызван в любое время
                CommandHandler("cancel", cancel_command),
                # Обработчик кнопки отмены, которая может быть показана
                CallbackQueryHandler(handle_cancel_button, pattern='^cancel_survey$'),
                 # Опциональный generic handler для текста вне состояний ConvHandler (например, если пользователь отправил текст,
                 # когда бот ждал кнопку или был в состоянии None).
                 # MessageHandler(filters.TEXT & ~filters.COMMAND, handle_generic_text_during_survey)
            ],
            # allow_reentry=True # Можно попробовать, если ConvHandler не подхватывает состояние из /start
        )

        # Логи о регистрации обработчиков
        logger.debug("ConvHandler entry point 'start_survey_.*$' registered.")
        logger.debug(f"ConvHandler state {ASKING_TEXT_ANSWER}: MessageHandler for text registered.")
        logger.debug(f"ConvHandler state {ASKING_TEXT_ANSWER}: CommandHandler for /cancel registered.")
        logger.debug(f"ConvHandler state {ASKING_TEXT_ANSWER}: CallbackQueryHandler for 'cancel_survey' registered.")
        logger.debug(f"ConvHandler fallback 'answer_q\\d+_o\\d+$' registered.")
        logger.debug("ConvHandler fallback /cancel registered.")
        logger.debug("ConvHandler fallback 'cancel_survey' registered.")


        # Регистрируем обработчики
        # /start обрабатывается первым. Он может начать или возобновить ConvHandler.
        application.add_handler(CommandHandler("start", start_command))
        logger.debug("/start CommandHandler registered.")

        # Затем регистрируем ConversationHandler. Он будет управлять диалогом.
        # Поскольку start_command может возвращать состояние ConvHandler,
        # ConvHandler должен быть зарегистрирован ПОСЛЕ start_command.
        application.add_handler(conv_handler)
        logger.debug("ConversationHandler registered.")


        logger.info("Бот запускается...")
        # run_polling блокирует поток
        application.run_polling(poll_interval=3.0, timeout=10)

    except Exception as e:
        logger.error(f"Ошибка запуска бота: {e}", exc_info=True)

# Если вы раскомментировали handle_generic_text, добавьте его здесь:
# async def handle_generic_text(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
#      """Универсальный обработчик текстовых сообщений, если они не были перехвачены ConvHandler"""
#      logger.debug(f"User {update.message.chat_id}: --> Entering handle_generic_text. Text: '{update.message.text}'")
#      if update.message and update.message.text:
#          # Проверяем, не является ли пользователь в середине опроса (по context.user_data)
#          # Эта проверка нужна, если handle_generic_text зарегистрирован ДО ConvHandler
#          # или если ConvHandler не настроен перехватывать все сообщения.
#          # В нашей текущей настройке ConvHandler должен перехватывать все, кроме /start.
#          # Этот generic handler может быть лишним или требовать пересмотра.
#          # Оставим его закомментированным, если ConvHandler настроен правильно.
#          # Если вы его раскомментируете, возможно, потребуется добавить его в fallbacks ConvHandler.
#
#          # if 'session_id' in context.user_data:
#          #      await update.message.reply_text("Вы сейчас проходите опрос. Пожалуйста, ответьте на текущий вопрос или используйте /cancel для отмены.")
#          # else:
#          #      await update.message.reply_text("Привет! Я бот для проведения опросов. Используйте /start для выбора опроса.")
#          pass # Ничего не делаем, если ConvHandler не перехватил
#      logger.debug(f"User {update.message.chat_id}: <-- Exiting handle_generic_text.")


if __name__ == '__main__':
    # При запуске telegram_bot.py напрямую, инициализируем DB
    db.init_db()
    db.migrate_users_from_json()
    db.populate_surveys()
    run_bot()