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
    """Генерация PDF путевки на строгом бланке с динамическим расчетом высоты"""
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    p.setFillColorRGB(0, 0, 0)
    p.setStrokeColorRGB(0, 0, 0)
    p.setLineWidth(0.5)

    navy_blue = (0.1, 0.25, 0.6)

    # 1. Шапка бланка
    p.setFont(FONT_NAME, 10)
    p.drawRightString(width - 54, height - 60, "Б А З А   О Т Д Ы Х А")
    p.drawRightString(width - 54, height - 75, "«А Р А Х Л Е Й»")

    # 2. Название документа
    p.setFont(FONT_NAME, 14)
    p.drawString(200, height - 120, "Путёвка № ")
    p.line(280, height - 122, 430, height - 122) 
    
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

    # 6. ДИНАМИЧЕСКИЙ СПИСОК ОТДЫХАЮЩИХ
    y_start = height - 310
    p.drawString(54, y_start, "ФИО отдыхающих:")
    
    guests = list(booking.guests.all())
    num_guests = len(guests)
    
    if num_guests == 0:
        y_pos = y_start - 22
        p.drawString(54, y_pos, "1.")
        p.line(70, y_pos - 2, width - 54, y_pos - 2)
        y_next = y_start - 44
    else:
        for idx, g in enumerate(guests, 1):
            y_pos = y_start - (idx * 22)
            p.drawString(54, y_pos, f"{idx}.")
            p.line(70, y_pos - 2, width - 54, y_pos - 2)
            p.setFillColorRGB(*navy_blue)
            p.drawString(80, y_pos + 2, f"{g.full_name} ({g.get_category_display()})")
            p.setFillColorRGB(0, 0, 0)
        
        y_next = y_start - (num_guests * 22) - 15

    # 7. ДИНАМИЧЕСКИЕ ДАТЫ
    sd, sm, sy = format_russian_date_parts(booking.start_date)
    ed, em, ey = format_russian_date_parts(booking.end_date)
    
    # Дата заезда
    p.drawString(54, y_next, "Дата заезда: «")
    p.line(135, y_next - 2, 155, y_next - 2)
    p.drawString(158, y_next, "»")
    p.line(175, y_next - 2, 285, y_next - 2)
    p.drawString(290, y_next, "20")
    p.line(305, y_next - 2, 335, y_next - 2)
    p.drawString(340, y_next, "г.")
    
    # Дата выезда
    y_end = y_next - 25
    p.drawString(54, y_end, "Дата выезда: «")
    p.line(135, y_end - 2, 155, y_end - 2)
    p.drawString(158, y_end, "»")
    p.line(175, y_end - 2, 285, y_end - 2)
    p.drawString(290, y_end, "20")
    p.line(305, y_end - 2, 335, y_end - 2)
    p.drawString(340, y_end, "г.")

    p.setFillColorRGB(*navy_blue)
    p.drawCentredString(145, y_next + 2, sd)
    p.drawCentredString(230, y_next + 2, sm)
    p.drawCentredString(320, y_next + 2, sy[-2:])
    
    p.drawCentredString(145, y_end + 2, ed)
    p.drawCentredString(230, y_end + 2, em)
    p.drawCentredString(320, y_end + 2, ey[-2:])
    p.setFillColorRGB(0, 0, 0)

    # 8. ДИНАМИЧЕСКИЙ НОМЕР ДОМА И ЦЕНА
    y_cabin = y_end - 35
    p.drawString(54, y_cabin, "Номер дома:")
    p.line(145, y_cabin - 2, width - 54, y_cabin - 2)
    
    y_price = y_cabin - 25
    p.drawString(54, y_price, "Цена путёвки:")
    p.line(145, y_price - 2, width - 54, y_price - 2)
    
    p.setFillColorRGB(*navy_blue)
    cabin_text = f"Дом №{booking.cabin.number}"
    if booking.second_cabin: 
        cabin_text += f", Дом №{booking.second_cabin.number}"
    p.drawString(155, y_cabin + 2, cabin_text)
    p.drawString(155, y_price + 2, f"{booking.total_price} руб.")
    p.setFillColorRGB(0, 0, 0)

    # 9. ДИНАМИЧЕСКАЯ ПОДПИСЬ
    y_sig = y_price - 40
    p.drawString(54, y_sig, "Подпись выдающего: ")
    p.drawString(235, y_sig, "/ Сидоренко Н.Л., врио проректора по МиСП")
    
    sig_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'signature.png')
    if os.path.exists(sig_path):
        p.drawImage(sig_path, 175, y_sig - 15, width=45, height=45, mask='auto')

    # 10. ДИНАМИЧЕСКАЯ ДАТА ВЫДАЧИ
    y_issue = y_sig - 40
    td, tm, ty = format_russian_date_parts(timezone.now().date())
    p.drawString(54, y_issue, "Дата выдачи: «")
    p.line(135, y_issue - 2, 155, y_issue - 2)
    p.drawString(158, y_issue, "»")
    p.line(175, y_issue - 2, 285, y_issue - 2)
    p.drawString(290, y_issue, "20")
    p.line(305, y_issue - 2, 335, y_issue - 2)
    p.drawString(340, y_issue, "г.")
    
    p.setFillColorRGB(*navy_blue)
    p.drawCentredString(145, y_issue + 2, td)
    p.drawCentredString(230, y_issue + 2, tm)
    p.drawCentredString(320, y_issue + 2, ty[-2:])

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

    elif event_type == "RECEIPT_UPLOADED":
        subject = f"Чек по бронированию {booking.booking_number} отправлен на проверку"
        body = (
            f"Здравствуйте, {booking.contact_name}!\n\n"
            f"Мы успешно получили ваш документ (чек), подтверждающий оплату бронирования {booking.booking_number}.\n"
            f"Администратор базы отдыха проверит банковскую транзакцию в ближайшее время. "
            f"После подтверждения официальная путевка с подписями будет выслана на ваш email.\n\n"
            f"⛔ ПРАВИЛА ОТМЕНЫ БРОНИРОВАНИЯ И ВОЗВРАТА СРЕДСТВ:\n"
            f"Поскольку вы уже прикрепили документ об оплате, автоматическая отмена в один клик невозможна. "
            f"Для отмены бронирования и оформления возврата денежных средств, пожалуйста, отправьте "
            f"письмо на адрес projectsddm@zabgu.ru, указав номер вашей брони {booking.booking_number} "
            f"и ФИО получателя путевки. Возврат оформляется вручную через бухгалтерию университета.\n\n"
            f"С уважением, Администрация базы отдыха ЗабГУ."
        )

    elif event_type == "CONFIRMED":
        subject = f"Бронирование {booking.booking_number} подтверждено"
        body = (
            f"Здравствуйте, {booking.contact_name}!\n\n"
            f"Ваша оплата успешно подтверждена администрацией ЗабГУ. Бронирование активно!\n"
            f"Официальная путевка прикреплена к этому письму.\n\n"
            f"⚠️ ВАЖНОЕ НАПОМИНАНИЕ ПРИ ЗАСЕЛЕНИИ:\n"
            f"При заселении на базу отдыха необходимо в обязательном порядке предоставить:\n"
            f"- Оригинал паспорта на каждого взрослого гостя;\n"
            f"- Оригинал свидетельства о рождении на каждого ребенка.\n"
            f"Без предъявления документов заселение не производится.\n\n"
            f"⛔ ПРАВИЛА ОТМЕНЫ БРОНИРОВАНИЯ И ВОЗВРАТА СРЕДСТВ:\n"
            f"Для отмены подтвержденного бронирования и оформления возврата денежных средств, пожалуйста, "
            f"отправьте письмо на адрес projectsddm@zabgu.ru, указав номер вашей брони {booking.booking_number} "
            f"и ФИО получателя путевки. Возврат оформляется в ручном режиме через бухгалтерию университета.\n\n"
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

    elif event_type == "USER_CANCELLED":
        subject = f"Бронирование {booking.booking_number} отменено вами"
        body = (
            f"Здравствуйте, {booking.contact_name}!\n\n"
            f"Вы успешно отменили вашу заявку на бронирование.\n"
            f"Номер брони: {booking.booking_number}\n\n"
            f"Выбранные вами даты и гостевые домики снова свободны для бронирования на интерактивной схеме.\n"
            f"Будем рады видеть вас на базе отдыха «Арахлей» ЗабГУ в следующий раз!\n\n"
            f"С уважением, Администрация базы отдыха ЗабГУ."
        )

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