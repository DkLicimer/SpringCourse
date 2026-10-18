import pytest
from datetime import date, timedelta
from django.utils import timezone
from apps.spaces.models import Room, SpaceBooking
from apps.spaces.services import SpaceBookingService
from apps.recreation.models import Cabin, RecreationBooking, CabinCategory
from apps.recreation.services import RecreationBookingService
from rest_framework.exceptions import ValidationError

@pytest.fixture
def test_room(db):
    return Room.objects.create(
        name="Зал 101",
        address="Корпус А",
        capacity_seats=100,
        amenities=["Проектор", "Микрофоны"],
        is_active=True
    )

@pytest.fixture
def test_cabin(db):
    return Cabin.objects.create(
        number=1,
        category=CabinCategory.STANDARD,
        capacity=4,
        price_staff_full_cabin=1000.00,
        price_student_bed=250.00,
        map_x=500.0,
        map_y=400.0,
        is_active=True
    )

@pytest.mark.django_db
def test_space_booking_prevents_overlap(test_room):
    now = timezone.now()
    start1 = now + timedelta(days=2, hours=10)
    end1 = now + timedelta(days=2, hours=12)

    # 1. Первое подтвержденное бронирование
    SpaceBooking.objects.create(
        room=test_room,
        event_name="Конференция",
        start_time=start1,
        end_time=end1,
        status=SpaceBooking.Status.APPROVED,
        applicant_full_name="Иванов И.И.",
        applicant_position="Доцент",
        applicant_email="ivanov@zabgu.ru",
        applicant_phone="+79140001122"
    )

    # 2. Попытка забронировать пересекающийся слот (11:00 - 13:00)
    overlap_payload = {
        "room": test_room,
        "event_name": "Семинар",
        "start_time": start1 + timedelta(hours=1),
        "end_time": end1 + timedelta(hours=1),
        "applicant_full_name": "Петров П.П.",
        "applicant_position": "Студент",
        "applicant_email": "petrov@zabgu.ru",
        "applicant_phone="+79149998877",
        "sound_engineer_required": False
    }

    with pytest.raises(ValidationError) as exc:
        SpaceBookingService.create_booking(overlap_payload)

    assert "уже занято" in str(exc.value)


@pytest.mark.django_db
def test_recreation_pricing_staff_vs_student(test_cabin):
    # Тест расчета стоимости: Сотрудник арендует домик целиком (1000 руб/сут * 2 сут = 2000 руб)
    staff_price = RecreationBookingService.calculate_price(
        cabin=test_cabin,
        second_cabin=None,
        guests_data=[{"full_name": "Сотрудник", "category": "ADULT"}],
        role=RecreationBooking.UserRole.STAFF,
        days=2
    )
    assert staff_price == 2000.00

    # Тест расчета стоимости: Студент арендует место (250 руб/сут * 2 сут = 500 руб)
    student_price = RecreationBookingService.calculate_price(
        cabin=test_cabin,
        second_cabin=None,
        guests_data=[{"full_name": "Студент", "category": "ADULT"}],
        role=RecreationBooking.UserRole.STUDENT,
        days=2
    )
    assert student_price == 500.00


@pytest.mark.django_db
def test_expired_recreation_booking_cleanup(test_cabin):
    from apps.recreation.tasks import cleanup_expired_bookings_task

    # Создаем просроченную неоплаченную бронь
    expired_booking = RecreationBooking.objects.create(
        cabin=test_cabin,
        user_role=RecreationBooking.UserRole.STAFF,
        start_date=date.today() + timedelta(days=5),
        end_date=date.today() + timedelta(days=7),
        total_price=2000.00,
        contact_name="Тест",
        contact_phone="+79141112233",
        contact_email="test@zabgu.ru",
        status=RecreationBooking.Status.PENDING,
        expires_at=timezone.now() - timedelta(minutes=15)
    )

    cleanup_expired_bookings_task()
    expired_booking.refresh_from_db()

    assert expired_booking.status == RecreationBooking.Status.CANCELLED