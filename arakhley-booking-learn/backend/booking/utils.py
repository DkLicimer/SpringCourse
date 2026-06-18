import io
import os
import logging
import traceback
from django.core.mail import EmailMessage
from django.conf import settings
from django.utils import timezone
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

logger = logging.getLogger(__name__)

# --- РЕГИСТРАЦИЯ ШРИФТА (для поддержки кириллицы в Docker/Linux) ---
FONT_NAME = 'Helvetica'
possible_font_paths = [
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "C:\\Windows\\Fonts\\arial.ttf",
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
    """Преобразование даты в формат: день, месяц (строкой), год"""
    months = {
        1: "января", 2: "февраля", 3: "марта", 4: "апреля",
        5: "мая", 6: "июня", 7: "июля", 8: "августа",
        9: "сентября", 10: "октября", 11: "ноября", 12: "декабря"
    }
    return str(date_obj.day), months.get(date_obj.month, ""), str(date_obj.year)

def generate_voucher_pdf(booking) -> bytes:
    """Генерация PDF путевки на строгом бланке (ОРИГИНАЛЬНАЯ ВЕРСТКА)"""
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    p.setFillColorRGB(0, 0, 0)
    p.setStrokeColorRGB(0, 0, 0)
    p.setLineWidth(0.5)

    # 1. Шапка бланка
    p.setFont(FONT_NAME, 10)
    p.drawRightString(width - 54, height - 60, "Б А З А   О Т Д Ы Х А")
    p.drawRightString(width - 54, height - 75, "«А Р А Х Л Е Й»")

    # 2. Название документа
    p.setFont(FONT_NAME, 14)
    p.drawString(200, height - 120, "Путёвка № ")
    p.line(280, height - 122, 430, height - 122) 
    
    navy_blue = (0.1, 0.25, 0.6)
    p.setFillColorRGB(*navy_blue)
    p.setFont(FONT_NAME, 13)
    p.drawString(285, height - 118, f"{booking.booking_number}")
    p.setFillColorRGB(0, 0, 0)

    # 3. Ф.И.О. заявителя
    p.setFont(FONT_NAME, 11)
    p.drawString(54, height - 160, "Ф.И.О. (полностью)")
    p.line(175, height - 162, width - 54, height - 162)
    p.line(54, height - 182, width - 54, height - 182) 
    p.setFillColorRGB(*navy_blue)
    p.drawString(185, height - 158, f"{booking.contact_name}")
    p.setFillColorRGB(0, 0, 0)

    # 4. Статус и чекбоксы
    p.drawString(54, height - 210, "Статус: Обучающийся")
    p.rect(180, height - 212, 12, 12)
    p.drawString(205, height - 210, "Факультет, группа")
    p.line(315, height - 212, width - 54, height - 212)
    p.drawString(98, height - 240, "Работник")
    p.rect(180, height - 242, 12, 12)
    p.drawString(205, height - 240, "Должность")
    p.line(275, height - 242, width - 54, height - 242)

    p.setFillColorRGB(*navy_blue)
    if booking.user_role == 'STUDENT':
        p.drawCentredString(186, height - 210, "X")
        p.drawString(325, height - 208, f"{booking.faculty or ''} {booking.academic_group or ''}".strip())
    else: 
        p.drawCentredString(186, height - 240, "X")
        p.drawString(285, height - 238, f"{booking.position or ''}, {booking.department or ''}".strip())
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
    for i in range(1, 6):
        y_pos = height - 325 - (i * 25)
        p.drawString(54, y_pos, f"{i}.")
        p.line(70, y_pos - 2, width - 54, y_pos - 2)
        if i - 1 < len(guests):
            p.setFillColorRGB(*navy_blue)
            p.drawString(80, y_pos + 2, f"{guests[i-1].full_name} ({guests[i-1].get_category_display()})")
            p.setFillColorRGB(0, 0, 0)

    # 7. Даты
    sd, sm, sy = format_russian_date_parts(booking.start_date)
    ed, em, ey = format_russian_date_parts(booking.end_date)
    # Заезд
    p.drawString(54, height - 485, "Дата заезда: «")
    p.line(135, height - 487, 155, height - 487)
    p.drawString(158, height - 485, "»")
    p.line(175, height - 487, 285, height - 487)
    p.drawString(290, height - 485, "20")
    p.line(305, height - 487, 335, height - 487)
    p.drawString(340, height - 485, "г.")
    # Выезд
    p.drawString(54, height - 515, "Дата выезда: «")
    p.line(135, height - 517, 155, height - 517)
    p.drawString(158, height - 515, "»")
    p.line(175, height - 517, 285, height - 517)
    p.drawString(290, height - 515, "20")
    p.line(305, height - 517, 335, height - 517)
    p.drawString(340, height - 515, "г.")

    p.setFillColorRGB(*navy_blue)
    p.drawCentredString(145, height - 483, sd)
    p.drawCentredString(230, height - 483, sm)
    p.drawCentredString(320, height - 483, sy[-2:])
    p.drawCentredString(145, height - 513, ed)
    p.drawCentredString(230, height - 513, em)
    p.drawCentredString(320, height - 513, ey[-2:])
    p.setFillColorRGB(0, 0, 0)

    # 8. Дом и Цена
    p.drawString(54, height - 550, "Номер дома:")
    p.line(145, height - 552, width - 54, height - 552)
    p.drawString(54, height - 580, "Цена путёвки:")
    p.line(145, height - 582, width - 54, height - 582)
    p.setFillColorRGB(*navy_blue)
    cabin_text = f"Дом №{booking.cabin.number}"
    if booking.second_cabin: cabin_text += f", Дом №{booking.second_cabin.number}"
    p.drawString(155, height - 548, cabin_text)
    p.drawString(155, height - 578, f"{booking.total_price} руб.")
    p.setFillColorRGB(0, 0, 0)

    # 9. Подпись
    p.drawString(54, height - 620, "Подпись выдающего: ")
    p.drawString(235, height - 620, "/ Сидоренко Н.Л., врио проректора по МиСП")
    sig_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'signature.png')
    if os.path.exists(sig_path):
        p.drawImage(sig_path, 175, height - 635, width=45, height=45, mask='auto')

    # 10. Дата выдачи
    td, tm, ty = format_russian_date_parts(timezone.now().date())
    p.drawString(54, height - 660, "Дата выдачи: «")
    p.line(135, height - 662, 155, height - 662)
    p.drawString(158, height - 660, "»")
    p.line(175, height - 662, 285, height - 662)
    p.drawString(290, height - 660, "20")
    p.line(305, height - 662, 335, height - 662)
    p.drawString(340, height - 660, "г.")
    p.setFillColorRGB(*navy_blue)
    p.drawCentredString(145, height - 658, td)
    p.drawCentredString(230, height - 658, tm)
    p.drawCentredString(320, height - 658, ty[-2:])

    p.showPage()
    p.save()
    pdf_data = buffer.getvalue()
    buffer.close()
    return pdf_data

def send_booking_notification(booking, event_type: str):
    """Комплексная отправка уведомлений"""
    subject = ""
    body = ""
    attachments = []
    
    site_url = "https://arakhleybazezabgu.ru"
    payment_link = f"{site_url}/booking-success/{booking.id}/"

    if event_type == "CREATED":
        subject = f"Бронирование {booking.booking_number} создано"
        body = (
            f"Здравствуйте, {booking.contact_name}!\n\n"
            f"Ваша заявка на бронирование домика успешно создана.\n"
            f"Номер брони: {booking.booking_number}\n"
            f"Сумма к оплате: {booking.total_price} руб.\n\n"
            f"Для завершения бронирования оплатите его и загрузите чек в течение 1 часа по ссылке:\n"
            f"{payment_link}\n\n"
            f"ВАЖНО: Если письма нет в папке Входящие, проверьте папку СПАМ.\n"
            f"С уважением, Администрация базы отдыха ЗабГУ."
        )

    elif event_type == "CONFIRMED":
        subject = f"Бронирование {booking.booking_number} подтверждено"
        body = (
            f"Здравствуйте, {booking.contact_name}!\n\n"
            f"Ваша оплата успешно подтверждена администрацией ЗабГУ. Бронирование активно!\n"
            f"Официальная путевка прикреплена к этому письму.\n\n"
            f"⚠️ ВАЖНОЕ НАПОМИНАНИЕ:\n"
            f"При заселении на базу отдыха необходимо в обязательном порядке предоставить:\n"
            f"- Оригинал паспорта на каждого взрослого гостя;\n"
            f"- Оригинал свидетельства о рождении на каждого ребенка.\n"
            f"Без предъявления документов заселение не производится.\n\n"
            f"Желаем вам хорошего отдыха!"
        )
        try:
            pdf_content = generate_voucher_pdf(booking)
            attachments.append((f"Voucher_{booking.booking_number}.pdf", pdf_content, "application/pdf"))
        except Exception as e:
            print(f"FAILED TO GENERATE PDF: {e}")

    elif event_type == "CANCELLED":
        subject = f"Бронирование {booking.booking_number} отменено"
        body = f"Время на оплату бронирования {booking.booking_number} истекло. Заявка аннулирована автоматически."

    elif event_type == "REJECTED":
        reason = f"\nПричина: {booking.receipt.admin_comment}" if hasattr(booking, 'receipt') and booking.receipt.admin_comment else ""
        subject = f"Оплата бронирования {booking.booking_number} отклонена"
        body = f"К сожалению, оплата по вашей брони была отклонена администратором.{reason}\nСвяжитесь с нами: projectsddm@zabgu.ru"

    if not subject: return

    email = EmailMessage(
        subject=subject, body=body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[booking.contact_email],
        reply_to=['projectsddm@zabgu.ru']
    )
    for att in attachments:
        email.attach(*att)

    try:
        email.send(fail_silently=False)
        print(f"EMAIL_SENT: {event_type} to {booking.contact_email}")
    except Exception as e:
        print(f"EMAIL_ERROR: {e}")