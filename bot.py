import asyncio
import logging
import os
import re
from aiogram.client.default import DefaultBotProperties
from aiogram import Bot, Dispatcher, F, Router
from aiogram.enums import ParseMode
# NEW: StateFilter нужен для более точной фильтрации по группе состояний
from aiogram.filters import CommandStart, or_f, StateFilter
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import (
    Message,
    ReplyKeyboardMarkup,
    KeyboardButton,
    ReplyKeyboardRemove
)
from dotenv import load_dotenv

load_dotenv()

# --- Настройка конфигурации ---
BOT_TOKEN = os.getenv("BOT_TOKEN")
GROUP_ID = os.getenv("GROUP_ID")

try:
    admin_group_id = int(GROUP_ID)
except (ValueError, TypeError):
    logging.critical("GROUP_ID не найден или имеет неверный формат. Убедитесь, что он есть в .env")
    admin_group_id = 0

logging.basicConfig(level=logging.INFO)

# --- Регулярное выражение для валидации номера ---
PHONE_REGEX = r"^\+?[78][-\s(]*\d{3}[-\s)]*\d{3}[-\s]*\d{2}[-\s]*\d{2}$"

# --- Инициализация ---
bot = Bot(
    token=BOT_TOKEN,
    default=DefaultBotProperties(parse_mode=ParseMode.MARKDOWN)
)
dp = Dispatcher()
router = Router()
dp.include_router(router)

# --- Клавиатуры ---
new_app_kb = ReplyKeyboardMarkup(
    keyboard=[
        [KeyboardButton(text="Создать новую заявку")]
    ],
    resize_keyboard=True,
)

# NEW: Клавиатура для отмены (первый шаг)
cancel_kb = ReplyKeyboardMarkup(
    keyboard=[
        [KeyboardButton(text="Отменить")]
    ],
    resize_keyboard=True
)

# NEW: Клавиатура "Назад" и "Отменить" (для всех последующих шагов)
back_cancel_kb = ReplyKeyboardMarkup(
    keyboard=[
        [KeyboardButton(text="⬅️ Назад"), KeyboardButton(text="Отменить")]
    ],
    resize_keyboard=True
)


# --- Определение состояний FSM ---
class ComplaintForm(StatesGroup):
    awaiting_photo = State()
    awaiting_description = State()
    awaiting_location = State()
    awaiting_name = State()
    awaiting_phone = State()


# --- Обработчики (Хендлеры) ---

# NEW: 1. Обработчик "Отменить" (работает во всех состояниях ComplaintForm)
# (Этот хендлер должен идти ДО других, чтобы перехватывать команду)
@router.message(F.text == "Отменить", StateFilter(ComplaintForm))
async def cancel_handler(message: Message, state: FSMContext):
    await state.clear()
    await message.answer(
        "Действие отменено. Вы можете создать новую заявку.",
        reply_markup=new_app_kb  # Возвращаем главную клавиатуру
    )


# NEW: 2. Обработчик "Назад" (работает во всех состояниях ComplaintForm)
# (Этот хендлер также должен идти ДО других)
@router.message(F.text == "⬅️ Назад", StateFilter(ComplaintForm))
async def back_handler(message: Message, state: FSMContext):
    current_state = await state.get_state()

    if current_state == ComplaintForm.awaiting_description.state:
        # Назад с Описания -> на Фото
        await state.set_state(ComplaintForm.awaiting_photo)
        await message.answer(
            "Вы вернулись к шагу 1.\n\n"
            "Пожалуйста, прикрепите **фото или видео** нарушения.",
            reply_markup=cancel_kb  # Клавиатура только с "Отменить"
        )

    elif current_state == ComplaintForm.awaiting_location.state:
        # Назад с Локации -> на Описание
        await state.set_state(ComplaintForm.awaiting_description)
        await message.answer(
            "Вы вернулись к шагу 2.\n\n"
            "Теперь напишите **краткое описание** (что и где происходит).",
            reply_markup=back_cancel_kb  # Уже есть "Назад"
        )

    elif current_state == ComplaintForm.awaiting_name.state:
        # Назад с Имени -> на Локацию
        await state.set_state(ComplaintForm.awaiting_location)
        await message.answer(
            "Вы вернулись к шагу 3.\n\n"
            "**Прикрепите геолокацию**.\n"
            "(📎 -> 'Геолокация' 📍 -> 'Отправить мою текущую геопозицию').",
            reply_markup=back_cancel_kb
        )

    elif current_state == ComplaintForm.awaiting_phone.state:
        # Назад с Телефона -> на Имя
        await state.set_state(ComplaintForm.awaiting_name)
        await message.answer(
            "Вы вернулись к шагу 4.\n\n"
            "Пожалуйста, напишите ваше **имя**.",
            reply_markup=back_cancel_kb
        )

    elif current_state == ComplaintForm.awaiting_photo.state:
        # Мы на первом шаге, идти "назад" некуда.
        # Кнопки "Назад" здесь быть не должно, но если пришла - просто отменяем.
        await state.clear()
        await message.answer(
            "Вы были на первом шаге, возврат невозможен. Заявка отменена.",
            reply_markup=new_app_kb
        )


# 3. Обработчик /start И кнопки "Создать новую заявку"
@router.message(or_f(CommandStart(), F.text == "Создать новую заявку"))
async def cmd_start_or_new(message: Message, state: FSMContext):
    await state.clear()
    await message.answer(
        "Здравствуйте! Это бот МинПрироды для приема жалоб.\n\n"
        "Пожалуйста, прикрепите **фото или видео** нарушения.",
        reply_markup=cancel_kb  # CHANGED: Вместо ReplyKeyboardRemove
    )
    await state.set_state(ComplaintForm.awaiting_photo)


# 4. Обработчики ФОТО / ВИДЕО
@router.message(ComplaintForm.awaiting_photo, F.photo)
async def process_photo(message: Message, state: FSMContext):
    photo_file_id = message.photo[-1].file_id
    await state.update_data(photo_id=photo_file_id)
    await message.answer(
        "Фото получено. Теперь напишите **краткое описание** (что и где происходит).",
        reply_markup=back_cancel_kb  # CHANGED: Добавлена клавиатура
    )
    await state.set_state(ComplaintForm.awaiting_description)


@router.message(ComplaintForm.awaiting_photo, F.video)
async def process_video(message: Message, state: FSMContext):
    video_file_id = message.video.file_id
    await state.update_data(video_id=video_file_id)
    await message.answer(
        "Видео получено. Теперь напишите **краткое описание** (что и где происходит).",
        reply_markup=back_cancel_kb  # CHANGED: Добавлена клавиатура
    )
    await state.set_state(ComplaintForm.awaiting_description)


# Этот обработчик ловит ЛЮБОЙ ввод, КРОМЕ фото или видео (и не "Отменить")
@router.message(ComplaintForm.awaiting_photo)
async def process_photo_invalid(message: Message):
    await message.answer("Пожалуйста, **сначала прикрепите фото или видео**.")


# 5. Обработчик для ОПИСАНИЯ
@router.message(ComplaintForm.awaiting_description, F.text)
async def process_description(message: Message, state: FSMContext):
    await state.update_data(description=message.text)
    await message.answer(
        "Описание принято. Теперь **прикрепите геолокацию**.\n\n"
        "Нажмите 📎 (скрепку) -> 'Геолокация' 📍 -> 'Отправить мою текущую геопозицию'.",
        reply_markup=back_cancel_kb  # CHANGED: Добавлена клавиатура
    )
    await state.set_state(ComplaintForm.awaiting_location)


# Этот обработчик ловит ЛЮБОЙ ввод, КРОМЕ текста (и не "Назад"/"Отменить")
@router.message(ComplaintForm.awaiting_description)
async def process_description_invalid(message: Message):
    await message.answer("Пожалуйста, введите **текстовое описание**.")


# 6. Обработчик для ГЕОЛОКАЦИИ
@router.message(ComplaintForm.awaiting_location, F.location)
async def process_location(message: Message, state: FSMContext):
    await state.update_data(
        latitude=message.location.latitude,
        longitude=message.location.longitude
    )
    await message.answer(
        "Геолокация принята. Теперь, пожалуйста, напишите ваше **имя**.",
        reply_markup=back_cancel_kb  # CHANGED: Добавлена клавиатура
    )
    await state.set_state(ComplaintForm.awaiting_name)


# Этот обработчик ловит ЛЮБОЙ ввод, КРОМЕ геолокации
@router.message(ComplaintForm.awaiting_location)
async def process_location_invalid(message: Message):
    await message.answer("Пожалуйста, **прикрепите геолокацию** (📎 -> 'Геолокация' 📍).")


# 7. Обработчик для ИМЕНИ
@router.message(ComplaintForm.awaiting_name, F.text)
async def process_name(message: Message, state: FSMContext):
    await state.update_data(name=message.text)
    await message.answer(
        "Имя принято. Теперь, пожалуйста, введите ваш **контактный номер телефона** "
        "в формате **+79991234567** или **89991234567**.",
        reply_markup=back_cancel_kb  # CHANGED: Добавлена клавиатура
    )
    await state.set_state(ComplaintForm.awaiting_phone)


# Этот обработчик ловит ЛЮБОЙ ввод, КРОМЕ текста
@router.message(ComplaintForm.awaiting_name)
async def process_name_invalid(message: Message):
    await message.answer("Пожалуйста, введите ваше **имя в виде текста**.")


# 8. Обработчик для ТЕЛЕФОНА (Финал)
@router.message(ComplaintForm.awaiting_phone, F.text.regexp(PHONE_REGEX))
async def process_phone_and_finish(message: Message, state: FSMContext):
    await state.update_data(phone=message.text)
    data = await state.get_data()
    await state.clear()

    # --- Подготовка данных для отправки ---
    user_description = data.get('description', 'Не указано')
    safe_description = escape_markdown_v2(user_description)
    user_name = data.get('name', 'Не указано')
    safe_name = escape_markdown_v2(user_name)
    user_phone = data.get('phone', 'Не указано')
    safe_phone = escape_markdown_v2(user_phone)
    user_info = f"От: @{message.from_user.username}" if message.from_user.username else f"От ID: {message.from_user.id}"

    caption = (
        f"🚨 *Новая заявка!*\n\n"
        f"*{user_info}*\n\n"
        f"*Контактные данные:*\n"
        f"Имя: {safe_name}\n"
        f"Телефон: {safe_phone}\n\n"
        f"*Описание:*\n"
        f"{safe_description}"
    )

    try:
        # --- Отправка данных в группу админам ---
        if 'photo_id' in data:
            await bot.send_photo(
                chat_id=admin_group_id,
                photo=data['photo_id'],
                caption=caption
            )
        elif 'video_id' in data:
            await bot.send_video(
                chat_id=admin_group_id,
                video=data['video_id'],
                caption=caption
            )

        await bot.send_location(
            chat_id=admin_group_id,
            latitude=data.get('latitude'),
            longitude=data.get('longitude')
        )

        # --- Уведомление пользователю ---
        await message.answer(
            "✅ **Ваша заявка принята!** Спасибо за помощь.\n\n"
            "Хотите отправить еще одну?",
            reply_markup=new_app_kb  # (Здесь все верно, возвращаем главную)
        )

    except Exception as e:
        logging.error(f"Не удалось отправить заявку в группу {admin_group_id}: {e}")
        await message.answer(
            "Произошла ошибка при отправке вашей заявки. Пожалуйста, попробуйте позже.",
            reply_markup=new_app_kb
        )


# 9. Обработчик невалидного ТЕЛЕФОНА
@router.message(ComplaintForm.awaiting_phone)
async def process_phone_invalid(message: Message):
    await message.answer(
        "❗️ **Формат номера не распознан.**\n\n"
        "Пожалуйста, введите номер в формате **+79991234567** или **89991234567**."
    )


# Вспомогательная функция (без изменений)
def escape_markdown_v2(text: str) -> str:
    special_chars = [
        '_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'
    ]
    for char in special_chars:
        text = text.replace(char, f'\\{char}')
    return text


# --- Функция запуска бота ---
async def main():
    if not BOT_TOKEN or not admin_group_id:
        logging.critical("!!! ОШИБКА: BOT_TOKEN или GROUP_ID не установлены в .env файле. Бот не может запуститься.")
        return

    logging.info("Бот запускается...")
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())


