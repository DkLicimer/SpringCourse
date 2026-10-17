import io
import os
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from apps.core.models import OrganizationSettings

FONT_NAME = 'Helvetica'
for p in ["/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", "C:\\Windows\\Fonts\\arial.ttf"]:
    if os.path.exists(p):
        try:
            pdfmetrics.registerFont(TTFont('UniCyrillic', p))
            FONT_NAME = 'UniCyrillic'
            break
        except Exception:
            pass

def generate_voucher_pdf(booking) -> bytes:
    settings_obj = OrganizationSettings.objects.first()
    org_name = settings_obj.university_name if settings_obj else "Университет"
    
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    
    p.setFont(FONT_NAME, 12)
    p.drawRightString(width - 50, height - 50, org_name)
    p.drawRightString(width - 50, height - 68, "ПУТЁВКА НА БАЗУ ОТДЫХА")
    
    p.setFont(FONT_NAME, 16)
    p.drawString(50, height - 110, f"Путёвка № {booking.booking_number}")
    p.line(50, height - 115, width - 50, height - 115)
    
    p.setFont(FONT_NAME, 11)
    p.drawString(50, height - 145, f"Заявитель: {booking.contact_name}")
    p.drawString(50, height - 165, f"Телефон: {booking.contact_phone} | Email: {booking.contact_email}")
    
    cabins_str = f"№{booking.cabin.number}"
    if booking.second_cabin:
        cabins_str += f", №{booking.second_cabin.number}"
    p.drawString(50, height - 195, f"Размещение: Гостевой дом(а) {cabins_str}")
    p.drawString(50, height - 215, f"Период заезда: с {booking.start_date.strftime('%d.%m.%Y')} по {booking.end_date.strftime('%d.%m.%Y')}")
    p.drawString(50, height - 235, f"Сумма оплаты: {booking.total_price} руб.")
    
    p.drawString(50, height - 275, "Список отдыхающих:")
    y = height - 295
    for idx, guest in enumerate(booking.guests.all(), 1):
        p.drawString(65, y, f"{idx}. {guest.full_name} ({guest.get_category_display()}) — Документ: {guest.document_info or 'не указан'}")
        y -= 18

    p.line(50, 100, width - 50, 100)
    p.drawString(50, 80, "Внимание: Заселение строго по оригиналам документов. Выезд до 12:00.")
    
    p.showPage()
    p.save()
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes