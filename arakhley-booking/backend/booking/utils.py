import io
from django.core.mail import EmailMessage
from django.conf import settings
from django.utils import timezone
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Регистрация кириллического шрифта (шрифт должен лежать в assets или системных папках)
# Для MVP можно использовать стандартный системный путь или положить шрифт в проект.
try:
    pdfmetrics.registerFont(TTFont('DejaVuSans', 'DejaVuSans.ttf'))
    FONT_NAME = 'DejaVuSans'
except Exception:
    # Фолбек на стандартный Helvetica, если шрифт не найден (русские буквы могут отображаться некорректно)
    FONT_NAME = 'Helvetica'


def generate_voucher_pdf(booking) -> bytes:
    """Генерация PDF путевки по ТЗ (Страница 14)"""
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    # Настройка шрифта
    p.setFont(FONT_NAME, 16)
    p.drawString(100, height - 80, f"ПУТЕВКА НА БАЗУ ОТДЫХА «АРАХЛЕЙ»")
    p.setFont(FONT_NAME, 12)
    p.drawString(100, height - 100, f"Номер бронирования: {booking.booking_number}")
    p.drawString(100, height - 120, f"Дата формирования: {timezone.now().strftime('%d.%m.%Y')}")
    
    p.setStrokeColorRGB(0.5, 0.5, 0.5)
    p.line(100, height - 135, width - 100, height - 135)

    # 1. Данные бронирующего
    p.setFont(FONT_NAME, 11)
    p.drawString(100, height - 160, f"ФИО бронирующего: {booking.contact_name}")
    
    category_str = "Сотрудник" if booking.user_role == 'STAFF' else "Обучающийся"
    p.drawString(100, height - 180, f"Категория: {category_str}")
    
    if booking.user_role == 'STAFF':
        p.drawString(100, height - 200, f"Подразделение: {booking.department or '-'}")
        p.drawString(100, height - 220, f"Должность: {booking.position or '-'}")
    else:
        p.drawString(100, height - 200, f"Факультет: {booking.faculty or '-'}")
        p.drawString(100, height - 220, f"Группа: {booking.academic_group or '-'}")

    # 2. Детали проживания
    p.drawString(100, height - 250, f"Домик: №{booking.cabin.number}")
    days = (booking.end_date - booking.start_date).days
    p.drawString(100, height - 270, f"Даты проживания: {booking.start_date.strftime('%d.%m.%Y')} — {booking.end_date.strftime('%d.%m.%Y')} ({days} дней)")
    p.drawString(100, height - 290, f"Количество забронированных мест: {booking.num_beds_booked}")

    # 3. Список отдыхающих
    p.drawString(100, height - 320, "Список отдыхающих:")
    guests = booking.guests.all()
    y_offset = 340
    if guests.exists():
        for i, guest in enumerate(guests, 1):
            p.drawString(120, height - y_offset, f"{i}. {guest.full_name} ({guest.get_category_display()})")
            y_offset += 20
    else:
        p.drawString(120, height - y_offset, "Совпадает с заявителем")
        y_offset += 20

    # 4. Итоговая информация и подпись
    p.line(100, height - y_offset - 10, width - 100, height - y_offset - 10)
    p.drawString(100, height - y_offset - 30, f"Общее число отдыхающих: {guests.count() or 1}")
    
    # Место для подписи проректора
    p.drawString(100, height - y_offset - 70, "Заместитель проректора по МиСП:")
    p.drawString(100, height - y_offset - 90, "____________________ / ____________________")
    p.drawString(100, height - y_offset - 110, "      (подпись)                 (ФИО)")

    # Справочная информация
    p.setFont(FONT_NAME, 9)
    p.setFillColorRGB(0.3, 0.3, 0.3)
    p.drawString(100, 50, "Пожалуйста, предъявите данную путевку при заселении на базу отдыха.")

    p.showPage()
    p.save()

    pdf_data = buffer.getvalue()
    buffer.close()
    return pdf_data


def send_booking_notification(booking, event_type: str):
    """
    Отправка Email в зависимости от этапа (ТЗ Страницы 13-14)
    """
    subject = ""
    body = ""
    attachments = []

    # Ссылка на страницу успешного бронирования (для оплаты)
    payment_link = f"http://localhost:5173/booking-success/{booking.id}/"  # URL фронтенда

    if event_type == "CREATED":
        subject = f"Бронирование {booking.booking_number} создано"
        body = (
            f"Здравствуйте, {booking.contact_name}!\n\n"
            f"Ваше бронирование успешно создано.\n"
            f"Номер бронирования: {booking.booking_number}\n"
            f"Сумма к оплате: {booking.total_price} руб.\n\n"
            f"Для подтверждения бронирования вам необходимо оплатить счет и загрузить чек в течение 1 часа.\n"
            f"Ссылка на страницу оплаты: {payment_link}\n\n"
            f"С уважением, Администрация базы отдыха."
        )

    elif event_type == "RECEIPT_UPLOADED":
        subject = f"Чек по бронированию {booking.booking_number} загружен"
        body = (
            f"Здравствуйте, {booking.contact_name}!\n\n"
            f"Ваш чек успешно загружен в систему и отправлен администратору на проверку.\n"
            f"Ожидайте подтверждения бронирования.\n"
        )

    elif event_type == "CONFIRMED":
        subject = f"Бронирование {booking.booking_number} подтверждено"
        body = (
            f"Здравствуйте, {booking.contact_name}!\n\n"
            f"Ваша оплата успешно подтверждена администратором. Бронирование активно!\n"
            f"Во вложении к этому письму находятся путевка и правила проживания.\n\n"
            f"Ждем вас на базе отдыха!"
        )
        # Генерируем путевку и прикрепляем её
        pdf_content = generate_voucher_pdf(booking)
        attachments.append((f"Voucher_{booking.booking_number}.pdf", pdf_content, "application/pdf"))

    elif event_type == "CANCELLED":
        subject = f"Бронирование {booking.booking_number} отменено"
        body = (
            f"Здравствуйте, {booking.contact_name}!\n\n"
            f"Время на оплату бронирования {booking.booking_number} истекло. "
            f"Бронирование автоматически отменено.\n"
        )

    # Инициализация и отправка сообщения
    email = EmailMessage(
        subject=subject,
        body=body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[booking.contact_email],
    )

    for att in attachments:
        email.attach(*att)

    try:
        email.send(fail_silently=True)
    except Exception:
        # Логируем ошибку, но не прерываем работу программы (для MVP)
        pass