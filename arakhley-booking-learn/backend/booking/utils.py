import io
import os
from django.core.mail import EmailMessage
from django.conf import settings
from django.utils import timezone
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Поиск и автоматическая регистрация системного кириллического шрифта на Windows / Linux
FONT_NAME = 'Helvetica'
possible_font_paths = [
    "C:\\Windows\\Fonts\\arial.ttf",
    "C:\\Windows\\Fonts\\times.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
]
for font_path in possible_font_paths:
    if os.path.exists(font_path):
        try:
            pdfmetrics.registerFont(TTFont('CyrillicFont', font_path))
            FONT_NAME = 'CyrillicFont'
            break
        except Exception:
            pass


def format_russian_date_parts(date_obj):
    """Преобразование даты в формат: день, месяц в родительном падеже, год"""
    months = {
        1: "января", 2: "февраля", 3: "марта", 4: "апреля",
        5: "мая", 6: "июня", 7: "июля", 8: "августа",
        9: "сентября", 10: "октября", 11: "ноября", 12: "декабря"
    }
    return str(date_obj.day), months.get(date_obj.month, ""), str(date_obj.year)


def generate_voucher_pdf(booking) -> bytes:
    """Генерация PDF путевки на бланке базы отдыха 'Арахлей' ЗабГУ"""
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    # Настройка черного цвета для статического текста бланка
    p.setFillColorRGB(0, 0, 0)
    p.setStrokeColorRGB(0, 0, 0)
    p.setLineWidth(0.5)

    # 1. Шапка бланка (выравнивание по правому краю)
    p.setFont(FONT_NAME, 10)
    p.drawRightString(width - 54, height - 60, "Б А З А   О Т Д Ы Х А")
    p.drawRightString(width - 54, height - 75, "«А Р А Х Л Е Й»")

    # 2. Название документа
    p.setFont(FONT_NAME, 14)
    p.drawString(200, height - 120, "Путёвка № ")
    p.line(280, height - 122, 430, height - 122) # Черная линия номера
    
    # Синий цвет для заполняемых полей
    navy_blue = (0.1, 0.25, 0.6)

    # Номер путевки
    p.setFillColorRGB(*navy_blue)
    p.setFont(FONT_NAME, 13)
    p.drawString(285, height - 118, f"{booking.booking_number}")
    p.setFillColorRGB(0, 0, 0) # Сброс

    # 3. Ф.И.О. заявителя
    p.setFont(FONT_NAME, 11)
    p.drawString(54, height - 160, "Ф.И.О. (полностью)")
    p.line(175, height - 162, width - 54, height - 162) # Векторная линия
    p.line(54, height - 182, width - 54, height - 182) # Вторая линия для длинных ФИО
    
    p.setFillColorRGB(*navy_blue)
    p.drawString(185, height - 158, f"{booking.contact_name}")
    p.setFillColorRGB(0, 0, 0)

    # 4. Статус и чекбоксы (Разнесены на абсолютные координаты во избежание сдвигов)
    # Строка 1: Обучающийся
    p.drawString(54, height - 210, "Статус: Обучающийся")
    p.rect(180, height - 212, 12, 12) # Квадрат чекбокса
    p.drawString(205, height - 210, "Факультет, группа")
    p.line(315, height - 212, width - 54, height - 212) # Линия факультета

    # Строка 2: Работник
    p.drawString(98, height - 240, "Работник")
    p.rect(180, height - 242, 12, 12) # Квадрат чекбокса
    p.drawString(205, height - 240, "Должность")
    p.line(275, height - 242, width - 54, height - 242) # Линия должности

    # Заполнение статуса
    p.setFillColorRGB(*navy_blue)
    if booking.user_role == 'STUDENT':
        p.drawCentredString(186, height - 210, "X") # Центрированный крестик
        group_info = f"{booking.faculty or ''} {booking.academic_group or ''}".strip()
        p.drawString(325, height - 208, group_info)
    else: # STAFF
        p.drawCentredString(186, height - 240, "X") # Центрированный крестик
        job_info = f"{booking.position or ''}, {booking.department or ''}".strip()
        p.drawString(285, height - 238, job_info)
    p.setFillColorRGB(0, 0, 0)

    # 5. Номер телефона
    p.drawString(54, height - 275, "Номер телефона:")
    p.line(165, height - 277, width - 54, height - 277)
    
    p.setFillColorRGB(*navy_blue)
    p.drawString(175, height - 273, f"{booking.contact_phone}")
    p.setFillColorRGB(0, 0, 0)

    # 6. Список отдыхающих
    p.drawString(54, height - 315, "ФИО отдыхающих")
    
    guests = list(booking.guests.all())
    for i in range(1, 5):
        y_pos = height - 325 - (i * 25)
        p.drawString(54, y_pos, f"{i}.")
        p.line(70, y_pos - 2, width - 54, y_pos - 2) # Чистая ровная линия
        
        if i - 1 < len(guests):
            p.setFillColorRGB(*navy_blue)
            guest_str = f"{guests[i-1].full_name} ({guests[i-1].get_category_display()})"
            p.drawString(80, y_pos + 2, guest_str)
            p.setFillColorRGB(0, 0, 0)

    # 7. Даты заезда и выезда (с векторными разделителями)
    # Заезд
    p.drawString(54, height - 460, "Дата заезда: «")
    p.line(135, height - 462, 155, height - 462) # Линия числа
    p.drawString(158, height - 460, "»")
    p.line(175, height - 462, 285, height - 462) # Линия месяца
    p.drawString(290, height - 460, "20")
    p.line(305, height - 462, 335, height - 462) # Линия года
    p.drawString(340, height - 460, "г.")

    # Выезд
    p.drawString(54, height - 490, "Дата выезда: «")
    p.line(135, height - 492, 155, height - 492)
    p.drawString(158, height - 490, "»")
    p.line(175, height - 492, 285, height - 492)
    p.drawString(290, height - 490, "20")
    p.line(305, height - 492, 335, height - 492)
    p.drawString(340, height - 490, "г.")

    # Наложение дат заезда/выезда
    start_day, start_month, start_year = format_russian_date_parts(booking.start_date)
    end_day, end_month, end_year = format_russian_date_parts(booking.end_date)

    p.setFillColorRGB(*navy_blue)
    # Отрендерить заезд
    p.drawCentredString(145, height - 458, start_day)
    p.drawCentredString(230, height - 458, start_month)
    p.drawCentredString(320, height - 458, start_year[-2:])
    # Отрендерить выезд
    p.drawCentredString(145, height - 488, end_day)
    p.drawCentredString(230, height - 488, end_month)
    p.drawCentredString(320, height - 488, end_year[-2:])
    p.setFillColorRGB(0, 0, 0)

    # 8. Номер дома (Новая строка)
    p.drawString(54, height - 525, "Номер дома:")
    p.line(145, height - 527, width - 54, height - 527)
    
    p.setFillColorRGB(*navy_blue)
    cabin_text = f"Дом №{booking.cabin.number}"
    if booking.second_cabin:
        cabin_text += f", Дом №{booking.second_cabin.number}"
    p.drawString(155, height - 523, cabin_text)
    p.setFillColorRGB(0, 0, 0)

    # 9. Цена путевки
    p.drawString(54, height - 555, "Цена путёвки:")
    p.line(145, height - 557, width - 54, height - 557)
    
    p.setFillColorRGB(*navy_blue)
    p.drawString(155, height - 553, f"{booking.total_price} руб.")
    p.setFillColorRGB(0, 0, 0)

    # 10. Подпись выдающего (Без статических подчеркиваний)
    p.drawString(54, height - 595, "Подпись выдающего: ")
    p.drawString(235, height - 595, "/ Сидоренко Н.Л., врио проректора по МиСП")
    
    # Путь к загруженной картинке подписи
    sig_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'signature.png')
    
    if os.path.exists(sig_path):
        # Накладываем подпись ровно поверх нарисованной векторной линии
        p.drawImage(sig_path, 175, height - 605, width=40, height=40, mask='auto')
    else:
        p.setFillColorRGB(*navy_blue)
        p.setFont(FONT_NAME, 9)
        p.drawString(195, height - 593, "[подпись]")
        p.setFillColorRGB(0, 0, 0)
        p.setFont(FONT_NAME, 11)

    # 11. Дата выдачи путевки (с векторными разделителями)
    p.drawString(54, height - 635, "Дата выдачи: «")
    p.line(135, height - 637, 155, height - 637)
    p.drawString(158, height - 635, "»")
    p.line(175, height - 637, 285, height - 637)
    p.drawString(290, height - 635, "20")
    p.line(305, height - 637, 335, height - 637)
    p.drawString(340, height - 635, "г.")
    
    today_day, today_month, today_year = format_russian_date_parts(timezone.now().date())
    p.setFillColorRGB(*navy_blue)
    p.drawCentredString(145, height - 633, today_day)
    p.drawCentredString(230, height - 633, today_month)
    p.drawCentredString(320, height - 633, today_year[-2:])

    p.showPage()
    p.save()

    pdf_data = buffer.getvalue()
    buffer.close()
    return pdf_data


def send_booking_notification(booking, event_type: str):
    """Отправка системных писем-уведомлений ЗабГУ"""
    subject = ""
    body = ""
    attachments = []

    # Рекомендуется заменить localhost на ваш домен в настройках
    payment_link = f"http://localhost:5173/booking-success/{booking.id}/"

    if event_type == "CREATED":
        subject = f"Бронирование {booking.booking_number} создано"
        body = (
            f"Здравствуйте, {booking.contact_name}!\n\n"
            f"Ваша заявка на бронирование домика на озере Арахлей успешно создана.\n"
            f"Номер брони: {booking.booking_number}\n"
            f"Сумма к оплате: {booking.total_price} руб.\n\n"
            f"Для завершения бронирования оплатите его по реквизитам и загрузите чек в течение 1 часа:\n"
            f"{payment_link}\n\n"
            f"С уважением, Администрация базы отдыха ЗабГУ."
        )

    elif event_type == "RECEIPT_UPLOADED":
        subject = f"Чек по бронированию {booking.booking_number} загружен"
        body = (
            f"Здравствуйте, {booking.contact_name}!\n\n"
            f"Ваш чек по бронированию {booking.booking_number} получен и отправлен на верификацию.\n"
            f"После проверки вы получите путевку на этот email.\n"
        )

    elif event_type == "CONFIRMED":
        subject = f"Бронирование {booking.booking_number} подтверждено"
        body = (
            f"Здравствуйте, {booking.contact_name}!\n\n"
            f"Ваша оплата успешно подтверждена администрацией ЗабГУ. Бронирование активно!\n"
            f"Сгенерированная путевка прикреплена к этому письму.\n\n"
            f"⚠️ ВАЖНОЕ НАПОМИНАНИЕ:\n"
            f"При заселении на базу отдыха необходимо в обязательном порядке предоставить:\n"
            f"- Оригинал паспорта на каждого взрослого гостя;\n"
            f"- Оригинал свидетельства о рождении на каждого ребенка.\n"
            f"Без предъявления документов заселение не производится.\n\n"
            f"Желаем вам хорошего отдыха!"
        )
        pdf_content = generate_voucher_pdf(booking)
        attachments.append((f"Voucher_{booking.booking_number}.pdf", pdf_content, "application/pdf"))

    elif event_type == "CANCELLED":
        subject = f"Бронирование {booking.booking_number} отменено"
        body = (
            f"Здравствуйте, {booking.contact_name}!\n\n"
            f"Время на подтверждение оплаты бронирования {booking.booking_number} истекло. "
            f"Заявка была аннулирована автоматически.\n"
        )

    elif event_type == "REJECTED":
        decline_reason = ""
        if hasattr(booking, 'receipt') and booking.receipt.admin_comment:
            decline_reason = f"\nПричина отклонения: {booking.receipt.admin_comment}\n"
            
        subject = f"Оплата бронирования {booking.booking_number} отклонена"
        body = (
            f"Здравствуйте, {booking.contact_name}!\n\n"
            f"К сожалению, оплата по вашему бронированию {booking.booking_number} не была подтверждена администратором.{decline_reason}\n"
            f"Ваша заявка переведена в статус 'Оплата отклонена'.\n"
            f"Для выяснения причин или повторного оформления свяжитесь с администрацией по адресу projectsddm@zabgu.ru.\n\n"
            f"С уважением, Администрация базы отдыха ЗабГУ."
        )

    email = EmailMessage(
        subject=subject,
        body=body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[booking.contact_email],
        reply_to=['projectsddm@zabgu.ru']
    )

    for att in attachments:
        email.attach(*att)

    try:
        email.send(fail_silently=True)
    except Exception:
        pass