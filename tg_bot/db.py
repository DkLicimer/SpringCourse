# db.py

import sqlite3
import json
import os
from datetime import datetime

DATABASE_FILE = "survey_data.db"
# Путь к файлу users.json из вашей предыдущей версии для миграции
# Убедитесь, что этот путь правильный в вашей структуре проекта
# Возможно, потребуется скорректировать этот путь в зависимости от структуры
OLD_USERS_FILE = os.path.join(os.path.dirname(__file__), "..", "..", "neymark", "backend", "apps", "tg_bot", "users.json")


def get_db_connection():
    """Устанавливает и возвращает соединение с базой данных."""
    conn = sqlite3.connect(DATABASE_FILE)
    conn.row_factory = sqlite3.Row # Позволяет получать строки как словари
    # Включаем поддержку внешних ключей
    conn.execute('PRAGMA foreign_keys = ON;')
    return conn

def init_db():
    """Создает таблицы базы данных, если они не существуют, и добавляет новые колонки."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Таблица пользователей Telegram
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            telegram_id INTEGER UNIQUE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Таблица определений опросников
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS surveys (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            description TEXT
        )
    ''')

    # Таблица вопросов опросников
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            survey_id INTEGER NOT NULL,
            question_index INTEGER NOT NULL, -- Порядок вопроса в опроснике (начиная с 0)
            text TEXT NOT NULL,
            type TEXT NOT NULL, -- например, 'choice', 'text'
            FOREIGN KEY (survey_id) REFERENCES surveys (id) ON DELETE CASCADE,
            UNIQUE (survey_id, question_index) -- Вопрос с таким индексом может быть только один в опроснике
        )
    ''')

    # Таблица вариантов ответов для вопросов типа 'choice'
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS options (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question_id INTEGER NOT NULL,
            option_index INTEGER NOT NULL, -- Порядок варианта ответа (начиная с 0)
            text TEXT NOT NULL,
            FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE,
            UNIQUE (question_id, option_index) -- Вариант с таким индексом может быть только один у вопроса
        )
    ''')

    # Таблица сессий прохождения опросников пользователями
    # ДОБАВЛЕНА КОЛОНКА current_question_index
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS survey_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL, -- Связь с пользователем
            survey_id INTEGER NOT NULL, -- Связь с опросником
            start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
            completion_time DATETIME, -- Время завершения (NULL, если не завершен)
            status TEXT DEFAULT 'started', -- 'started', 'completed', 'cancelled'
            current_question_index INTEGER DEFAULT 0, -- Индекс текущего вопроса в сессии
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (survey_id) REFERENCES surveys (id) ON DELETE CASCADE
        )
    ''')

    # Проверка и добавление колонки current_question_index, если она не существует
    try:
        cursor.execute("SELECT current_question_index FROM survey_sessions LIMIT 1;")
        # Если запрос успешен, колонка существует
        print("Колонка current_question_index уже существует в survey_sessions.")
    except sqlite3.OperationalError:
        # Если запрос завершается с ошибкой, колонка не существует, добавляем ее
        print("Добавляем колонку current_question_index в survey_sessions...")
        cursor.execute("ALTER TABLE survey_sessions ADD COLUMN current_question_index INTEGER DEFAULT 0;")
        print("Колонка current_question_index успешно добавлена.")


    # Таблица ответов пользователей в рамках сессии
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS answers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER NOT NULL, -- Связь с сессией
            question_id INTEGER NOT NULL, -- Связь с вопросом
            answer_text TEXT, -- Сам ответ (для текста или выбранной опции)
            answer_option_index INTEGER, -- Индекс выбранной опции (NULL для текстового ответа)
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, -- Время сохранения ответа
            FOREIGN KEY (session_id) REFERENCES survey_sessions (id) ON DELETE CASCADE,
            FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE,
            UNIQUE (session_id, question_id) -- В рамках одной сессии на один вопрос можно ответить только один раз
        )
    ''')

    conn.commit()
    conn.close()
    print("База данных инициализирована/обновлена.")


def migrate_users_from_json():
    """Мигрирует пользователей из старого users.json в новую таблицу users."""
    # Корректировка пути к файлу
    # Определяем путь к users.json относительно текущего файла db.py
    db_dir = os.path.dirname(__file__)
    # Предполагаем структуру: ваш_проект/neymark/backend/apps/tg_bot/db.py
    # и ваш_проект/neymark/backend/apps/tg_bot/users.json
    old_users_file_path = os.path.join(db_dir, "users.json") # Это более вероятный путь
    # Если ваша структура другая, скорректируйте путь здесь.
    # Например, если users.json лежит рядом с db.py
    # OLD_USERS_FILE = os.path.join(os.path.dirname(__file__), "users.json")


    if not os.path.exists(old_users_file_path):
        # Попробуем альтернативный путь, если первый не сработал
        old_users_file_path = os.path.join(db_dir, "..", "..", "..", "users.json") # Пример: если users.json на 3 уровня выше
        print(f"Попытка найти старый файл пользователей по пути: {old_users_file_path}")
        if not os.path.exists(old_users_file_path):
             print(f"Старый файл пользователей не найден ни по одному пути. Миграция не требуется.")
             return

    print(f"Обнаружен старый файл пользователей: {old_users_file_path}. Запуск миграции...")

    try:
        with open(old_users_file_path, "r", encoding="utf-8") as f:
            content = f.read().strip()
            if not content:
                old_users = []
            else:
                # Проверяем, начинается ли контент с '[' (ожидаем JSON массив)
                if not content.startswith('['):
                     print(f"Содержимое старого файла пользователей {old_users_file_path} не похоже на JSON массив. Миграция отменена.")
                     return
                old_users = json.loads(content)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"Ошибка при чтении или парсинге старого файла пользователей {old_users_file_path}: {e}. Миграция отменена.")
        return

    if not old_users:
         print("Старый файл пользователей пуст или содержит только пустой массив. Миграция не требуется.")
         return

    conn = get_db_connection()
    cursor = conn.cursor()
    migrated_count = 0
    skipped_count = 0

    # Начинаем транзакцию для ускорения вставки
    conn.execute("BEGIN;")

    for user_data in old_users:
        telegram_id = user_data.get("telegram_id")
        if isinstance(telegram_id, (int, float)): # Принимаем int или float
             # Преобразуем в int на всякий случай
             telegram_id = int(telegram_id)
             try:
                # Используем INSERT OR IGNORE, чтобы избежать ошибок UNIQUE constraint
                cursor.execute("INSERT OR IGNORE INTO users (telegram_id) VALUES (?)", (telegram_id,))
                if cursor.rowcount > 0: # Проверяем, была ли вставка
                   migrated_count += 1
                else:
                   skipped_count += 1 # Пропущено, т.к. уже существует
             except Exception as e:
                print(f"Ошибка миграции пользователя {telegram_id}: {e}")
                skipped_count += 1
        else:
             print(f"Пропущен некорректный пользователь (ожидается числовой telegram_id): {user_data}")
             skipped_count += 1

    conn.commit() # Фиксируем транзакцию
    conn.close()
    print(f"Миграция пользователей завершена. Успешно мигрировано: {migrated_count}, Пропущено (уже существуют или некорректны): {skipped_count}")

    # Опционально: переименовать или удалить старый файл после миграции
    # try:
    #     os.rename(old_users_file_path, old_users_file_path + ".migrated")
    #     print(f"Старый файл пользователей переименован в {old_users_file_path}.migrated")
    # except OSError as e:
    #     print(f"Не удалось переименовать старый файл пользователей: {e}")


def populate_surveys():
    """Заполняет базу данных определениями опросников, если они пусты."""
    surveys_to_add = [
        {
            "key": "quality",
            "title": "Опрос о качестве преподавания",
            "description": "Опрос в конце занятия",
            "questions": [
                { "index": 0, "text": "Насколько вы поняли материал занятия?", "type": "choice", "options": ["Совсем не понял", "Понял немного", "Понял большую часть", "Понял полностью"] },
                { "index": 1, "text": "Была ли скорость изложения материала комфортной?", "type": "choice", "options": ["Слишком медленно", "Комфортно", "Слишком быстро"] },
                { "index": 2, "text": "Насколько преподаватель был готов ответить на ваши вопросы?", "type": "choice", "options": ["Совсем не готов", "Скорее не готов", "Скорее готов", "Полностью готов"] },
                { "index": 3, "text": "Были ли примеры и объяснения преподавателя понятными?", "type": "choice", "options": ["Совсем непонятны", "Скорее непонятны", "Скорее понятны", "Полностью понятны"] },
                { "index": 4, "text": "Насколько занятие было интересным?", "type": "choice", "options": ["Совсем неинтересно", "Скорее неинтересно", "Скорее интересно", "Очень интересно"] },
                { "index": 5, "text": "Как вы оцениваете общую структуру занятия?", "type": "choice", "options": ["Плохо", "Удовлетворительно", "Хорошо", "Отлично"] },
                { "index": 6, "text": "Были ли технические проблемы во время занятия (звук, видео, презентация)?", "type": "choice", "options": ["Много проблем", "Незначительные проблемы", "Проблем не было"] },
                { "index": 7, "text": "Насколько вы бы порекомендовали это занятие другим?", "type": "choice", "options": ["Не порекомендовал бы", "Скорее не порекомендовал бы", "Скорее порекомендовал бы", "Определенно порекомендовал бы"] },
                { "index": 8, "text": "Ваши дополнительные комментарии или предложения (можно написать текстом):", "type": "text", "options": [] } # Важно: index 8 - текстовый вопрос
            ]
        },
        {
            "key": "engagement",
            "title": "Краткий опрос об увлеченности",
            "description": "Короткий опрос",
            "questions": [
                { "index": 0, "text": "Насколько вы чувствовали себя вовлеченным в процесс занятия?", "type": "choice", "options": ["Совсем не вовлечен", "Немного вовлечен", "Хорошо вовлечен", "Полностью вовлечен"] },
                { "index": 1, "text": "Возникло ли у вас желание узнать больше по теме занятия после его завершения?", "type": "choice", "options": ["Совсем нет", "Немного", "Да, возможно", "Определенно да"] }
            ]
        }
    ]

    conn = get_db_connection()
    cursor = conn.cursor()

    added_count = 0
    skipped_count = 0

    for survey_data in surveys_to_add:
        try:
            # Проверяем, существует ли опрос с таким ключом
            cursor.execute("SELECT id FROM surveys WHERE key = ?", (survey_data["key"],))
            existing_survey = cursor.fetchone()

            if existing_survey:
                # print(f"Опрос с ключом '{survey_data['key']}' уже существует. Пропускаем.")
                skipped_count += 1
                continue

            # Начинаем транзакцию для добавления одного опроса целиком
            conn.execute("BEGIN;")

            # Добавляем опрос
            cursor.execute("INSERT INTO surveys (key, title, description) VALUES (?, ?, ?)",
                           (survey_data["key"], survey_data["title"], survey_data["description"]))
            survey_id = cursor.lastrowid

            # Добавляем вопросы и опции
            for question_data in survey_data["questions"]:
                cursor.execute("INSERT INTO questions (survey_id, question_index, text, type) VALUES (?, ?, ?, ?)",
                               (survey_id, question_data["index"], question_data["text"], question_data["type"]))
                question_id = cursor.lastrowid

                if question_data["type"] == "choice":
                    for option_index, option_text in enumerate(question_data["options"]):
                         cursor.execute("INSERT INTO options (question_id, option_index, text) VALUES (?, ?, ?)",
                                        (question_id, option_index, option_text))

            conn.commit() # Фиксируем транзакцию для этого опроса
            added_count += 1
            print(f"Опрос '{survey_data['title']}' добавлен.")

        except Exception as e:
            print(f"Ошибка при добавлении опроса '{survey_data['key']}': {e}")
            conn.rollback() # Откатываем изменения для этого опроса при ошибке


    # conn.commit() # Общий коммит убран, т.к. используем commit для каждого опроса
    conn.close()
    print(f"Заполнение базы данных опросами завершено. Добавлено: {added_count}, Пропущено: {skipped_count}")


# --- Функции для логики бота ---

def get_user_by_telegram_id(telegram_id: int):
    """Возвращает пользователя по его Telegram ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE telegram_id = ?", (telegram_id,))
    user = cursor.fetchone()
    conn.close()
    # Возвращаем словарь, если пользователь найден, иначе None
    return dict(user) if user else None


def create_user(telegram_id: int):
    """Создает нового пользователя в базе данных."""
    conn = get_db_connection()
    cursor = conn.cursor()
    user_id = None
    try:
        cursor.execute("INSERT INTO users (telegram_id) VALUES (?)", (telegram_id,))
        user_id = cursor.lastrowid
        conn.commit()
        print(f"Создан новый пользователь с Telegram ID: {telegram_id}")
    except sqlite3.IntegrityError:
        # Этого не должно произойти, если вызывается после проверки is_user_registered, но на всякий случай
        print(f"Пользователь с Telegram ID {telegram_id} уже существует (IntegrityError при создании).")
        # Пытаемся получить ID существующего пользователя
        user = get_user_by_telegram_id(telegram_id)
        user_id = user['id'] if user else None # Вернет None, если что-то пошло не так даже при получении
    except Exception as e:
         print(f"Неизвестная ошибка при создании пользователя {telegram_id}: {e}")
         conn.rollback() # Откатываем, если была другая ошибка
         user_id = None
    finally:
        conn.close()
    return user_id


def get_or_create_user_id(telegram_id: int) -> int:
    """Получает ID пользователя из базы данных, или создает нового, если не найден."""
    user = get_user_by_telegram_id(telegram_id)
    if user:
        return user['id']
    else:
        return create_user(telegram_id)


def get_all_surveys():
    """Возвращает список всех доступных опросов (для меню /start)."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, key, title FROM surveys ORDER BY title")
    surveys = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return surveys

def get_survey_by_key(survey_key: str):
    """Возвращает основную информацию об опроснике по его ключу."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, key, title FROM surveys WHERE key = ?", (survey_key,))
    survey_row = cursor.fetchone()
    conn.close()
    return dict(survey_row) if survey_row else None


def get_question_by_survey_id_and_index(survey_id: int, question_index: int):
    """Возвращает детали вопроса для данного опросника по его порядковому номеру."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Получаем вопрос по survey_id и question_index
    cursor.execute("SELECT id, question_index, text, type FROM questions WHERE survey_id = ? AND question_index = ?", (survey_id, question_index))
    question_row = cursor.fetchone()
    if not question_row:
        conn.close()
        return None # Вопрос не найден

    question = dict(question_row)
    question['options'] = [] # Будет заполняться только для choice

    if question['type'] == 'choice':
        # Получаем опции для вопросов типа 'choice'
        cursor.execute("SELECT id, option_index, text FROM options WHERE question_id = ? ORDER BY option_index", (question['id'],))
        option_rows = cursor.fetchall()
        # Сохраняем id опции, option_index и текст
        question['options'] = [dict(o_row) for o_row in option_rows]


    conn.close()
    return question # Возвращает структуру вопроса


def get_question_count_by_survey_id(survey_id: int) -> int:
    """Возвращает общее количество вопросов в опроснике по его ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM questions WHERE survey_id = ?", (survey_id,))
    count = cursor.fetchone()[0]
    conn.close()
    return count


def start_survey_session(user_id: int, survey_id: int):
    """Начинает новую сессию прохождения опросника для пользователя, устанавливая текущий индекс вопроса в 0."""
    conn = get_db_connection()
    cursor = conn.cursor()
    session_id = None
    try:
        # Устанавливаем current_question_index = 0 при старте
        cursor.execute("INSERT INTO survey_sessions (user_id, survey_id, status, current_question_index) VALUES (?, ?, ?, ?)",
                       (user_id, survey_id, 'started', 0))
        session_id = cursor.lastrowid
        conn.commit()
        print(f"Начата сессия {session_id} для пользователя {user_id}, опрос {survey_id}. Текущий вопрос: 0")
    except Exception as e:
         print(f"Ошибка при старте сессии для пользователя {user_id}, опрос {survey_id}: {e}")
         conn.rollback()
         session_id = None
    finally:
        conn.close()
    return session_id


def get_active_survey_session(user_id: int):
    """Возвращает активную сессию пользователя, если она есть, включая current_question_index."""
    conn = get_db_connection()
    cursor = conn.cursor()
    # Ищем сессию, которая начата, но еще не завершена или отменена
    # ORDER BY start_time DESC - чтобы взять последнюю, если вдруг их несколько
    cursor.execute("SELECT id, user_id, survey_id, status, current_question_index FROM survey_sessions WHERE user_id = ? AND status = 'started' ORDER BY start_time DESC LIMIT 1", (user_id,))
    session = cursor.fetchone()
    conn.close()
    return dict(session) if session else None

def update_session_current_question_index(session_id: int, new_index: int):
    """Обновляет индекс текущего вопроса для данной сессии."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE survey_sessions SET current_question_index = ? WHERE id = ?", (new_index, session_id))
        conn.commit()
        # print(f"Обновлен индекс текущего вопроса для сессии {session_id} на {new_index}")
    except Exception as e:
        print(f"Ошибка при обновлении индекса вопроса для сессии {session_id}: {e}")
        conn.rollback()
    finally:
        conn.close()


def save_answer(session_id: int, question_id: int, answer_text: str, answer_option_index: int = None):
    """Сохраняет ответ пользователя в рамках сессии."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Используем INSERT OR REPLACE на случай, если ответ на этот вопрос в рамках сессии уже был (повторное нажатие кнопки?)
        # Это упрощает логику, позволяя перезаписать ответ. Если нужно сохранять все попытки, логика будет сложнее.
        cursor.execute("""
            INSERT OR REPLACE INTO answers (session_id, question_id, answer_text, answer_option_index, timestamp)
            VALUES (?, ?, ?, ?, ?)
        """, (session_id, question_id, answer_text, answer_option_index, datetime.now().isoformat()))
        conn.commit()
        # print(f"Сохранен/обновлен ответ для сессии {session_id}, вопрос {question_id}")
    except Exception as e:
         print(f"Ошибка при сохранении ответа для сессии {session_id}, вопрос {question_id}: {e}")
         conn.rollback()
    finally:
        conn.close()


def complete_survey_session(session_id: int):
    """Отмечает сессию опросника как завершенную."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE survey_sessions SET completion_time = ?, status = 'completed' WHERE id = ?",
                       (datetime.now().isoformat(), session_id))
        conn.commit()
        print(f"Сессия {session_id} завершена.")
    except Exception as e:
         print(f"Ошибка при завершении сессии {session_id}: {e}")
         conn.rollback()
    finally:
        conn.close()


def cancel_survey_session(session_id: int):
    """Отмечает сессию опросника как отмененную."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE survey_sessions SET status = 'cancelled' WHERE id = ?",
                       (session_id,))
        conn.commit()
        print(f"Сессия {session_id} отменена.")
    except Exception as e:
         print(f"Ошибка при отмене сессии {session_id}: {e}")
         conn.rollback()
    finally:
        conn.close()

# --- Функции для обработки результатов (для AI) ---

def get_completed_session_data(session_id: int):
    """
    Извлекает полные данные завершенной сессии с ответами для анализа.
    Возвращает структуру, удобную для передачи в AI.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Получаем данные сессии, пользователя и опроса
    cursor.execute("""
        SELECT
            ss.id AS session_id, ss.start_time, ss.completion_time, ss.status,
            u.telegram_id,
            s.key AS survey_key, s.title AS survey_title
        FROM survey_sessions ss
        JOIN users u ON ss.user_id = u.id
        JOIN surveys s ON ss.survey_id = s.id
        WHERE ss.id = ? AND ss.status = 'completed'
    """, (session_id,))
    session_data = cursor.fetchone()
    if not session_data:
        conn.close()
        return None

    session_data = dict(session_data)
    session_data['answers'] = []

    # Получаем все ответы и связанные вопросы для этой сессии
    cursor.execute("""
        SELECT
            a.answer_text, a.answer_option_index, a.timestamp,
            q.id AS question_id, q.question_index, q.text AS question_text, q.type AS question_type
        FROM answers a
        JOIN questions q ON a.question_id = q.id
        WHERE a.session_id = ?
        ORDER BY q.question_index
    """, (session_id,))
    answer_rows = cursor.fetchall()

    for row in answer_rows:
        answer = dict(row)
        # Для ответов типа 'choice', answer_text уже содержит текст выбранной опции
        session_data['answers'].append(answer)

    conn.close()
    return session_data

def get_all_completed_sessions_for_ai():
     """
     Возвращает список всех завершенных сессий с их ответами.
     Можно добавить фильтры (например, по опроснику, дате и т.д.)
     """
     conn = get_db_connection()
     cursor = conn.cursor()

     cursor.execute("""
         SELECT
             ss.id AS session_id
         FROM survey_sessions ss
         WHERE ss.status = 'completed'
         ORDER BY ss.completion_time DESC
     """)
     session_ids = [row['session_id'] for row in cursor.fetchall()]

     conn.close()

     all_sessions_data = []
     for session_id in session_ids:
          # Извлекаем полные данные для каждой сессии по ID
          session_data = get_completed_session_data(session_id)
          if session_data:
               all_sessions_data.append(session_data)

     return all_sessions_data


if __name__ == '__main__':
    # Пример использования и тестирования модуля db
    print("--- Инициализация/обновление базы данных ---")
    init_db()
    migrate_users_from_json() # Попытка миграции старых пользователей
    populate_surveys() # Заполнение базы данными опросов

    print("\n--- Тестирование DB функций ---")
    # Тест получения опросов
    surveys = get_all_surveys()
    print(f"Доступные опросы ({len(surveys)}): {[s['title'] for s in surveys]}")

    # Тест получения деталей опроса и вопросов
    quality_survey_data = get_survey_by_key('quality')
    if quality_survey_data:
        print(f"\nДетали опроса '{quality_survey_data['title']}' (ID: {quality_survey_data['id']}):")
        total_q = get_question_count_by_survey_id(quality_survey_data['id'])
        print(f"  Всего вопросов: {total_q}")
        first_q = get_question_by_survey_id_and_index(quality_survey_data['id'], 0)
        if first_q:
            print(f"  Первый вопрос (индекс 0, ID: {first_q['id']}): {first_q['text']}")
            if first_q['type'] == 'choice':
                print(f"    Опции: {[opt['text'] for opt in first_q['options']]}")
        last_q_index = total_q - 1
        last_q = get_question_by_survey_id_and_index(quality_survey_data['id'], last_q_index)
        if last_q:
             print(f"  Последний вопрос (индекс {last_q_index}, ID: {last_q['id']}): {last_q['text']}")
             print(f"    Тип: {last_q['type']}")


    # Тест пользователя и сессии
    test_telegram_id = 987654321 # Условный Telegram ID, отличающийся от 12345
    user_id = get_or_create_user_id(test_telegram_id)
    print(f"\nТестовый пользователь (Telegram ID: {test_telegram_id}, DB ID: {user_id})")

    active_session = get_active_survey_session(user_id)
    if active_session:
        print(f"У пользователя есть активная сессия ID: {active_session['id']}, текущий вопрос: {active_session['current_question_index']}")
        cancel_survey_session(active_session['id'])
        print("Активная сессия отменена.")
        active_session = get_active_survey_session(user_id) # Проверяем еще раз
        print(f"Активная сессия после отмены: {active_session}")


    if quality_survey_data:
        session_id = start_survey_session(user_id, quality_survey_data['id'])
        print(f"Начата новая сессия ID: {session_id}. Текущий вопрос: 0")

        # Получаем данные сессии для проверки current_question_index
        session_data_after_start = get_active_survey_session(user_id)
        print(f"Сессия после старта (get_active): {session_data_after_start}")


        first_q = get_question_by_survey_id_and_index(quality_survey_data['id'], 0)
        if first_q:
            print(f"Сохраняем ответ на первый вопрос (индекс 0, ID: {first_q['id']})")
            if first_q['type'] == 'choice' and first_q['options']:
                # Сохраняем ответ на первую опцию первого вопроса
                save_answer(session_id, first_q['id'], first_q['options'][0]['text'], first_q['options'][0]['option_index'])
                # Имитируем переход к следующему вопросу, обновляя индекс
                update_session_current_question_index(session_id, 1)
            elif first_q['type'] == 'text':
                 save_answer(session_id, first_q['id'], "Это тестовый текстовый ответ на вопрос 0.")
                 # Имитируем переход к следующему вопросу, обновляя индекс
                 update_session_current_question_index(session_id, 1)

        # Получаем данные сессии после сохранения первого ответа и обновления индекса
        session_data_after_q1 = get_active_survey_session(user_id)
        print(f"Сессия после ответа на Q0 (get_active): {session_data_after_q1}")


        second_q = get_question_by_survey_id_and_index(quality_survey_data['id'], 1)
        if second_q:
             print(f"Сохраняем ответ на второй вопрос (индекс 1, ID: {second_q['id']})")
             if second_q['type'] == 'choice' and second_q['options']:
                  save_answer(session_id, second_q['id'], second_q['options'][1]['text'], second_q['options'][1]['option_index'])
                  # Имитируем переход к следующему вопросу, обновляя индекс
                  update_session_current_question_index(session_id, 2)
             elif second_q['type'] == 'text':
                  save_answer(session_id, second_q['id'], "Это тестовый текстовый ответ на второй вопрос (Q1).")
                  # Имитируем переход к следующему вопросу, обновляя индекс
                  update_session_current_question_index(session_id, 2)

        # Получаем данные сессии после сохранения второго ответа и обновления индекса
        session_data_after_q2 = get_active_survey_session(user_id)
        print(f"Сессия после ответа на Q1 (get_active): {session_data_after_q2}")


        # Имитируем завершение всех вопросов и завершаем сессию
        complete_survey_session(session_id)
        print(f"Сессия ID: {session_id} завершена.")

        completed_session_data = get_completed_session_data(session_id)
        print(f"\nДанные завершенной сессии ID: {session_id}")
        # print(json.dumps(completed_session_data, indent=2, ensure_ascii=False)) # Раскомментировать для полного вывода

    print("\nПолучение всех завершенных сессий для AI:")
    all_completed = get_all_completed_sessions_for_ai()
    print(f"Найдено завершенных сессий: {len(all_completed)}")
    # if all_completed:
    #      print("Данные первой завершенной сессии:", json.dumps(all_completed[0], indent=2, ensure_ascii=False))