from django.contrib.auth import authenticate
from ninja import Router
from typing import List
from .models import User, Computer, Booking
from .auth import create_token, AuthBearer, AdminBearer
from .schemas import (
    RegisterIn, LoginIn, TokenOut,
    ComputerIn, ComputerOut, BookingIn, BookingOut,
)

router = Router()

@router.post("/auth/register", response=TokenOut)
def register(request, data: RegisterIn):
    if User.objects.filter(username=data.username).exists():
        return router.api.create_response(request, {"detail": "Логин занят"}, status=400)
    user = User.objects.create_user(
        username=data.username, password=data.password,
        email=data.email, role="user",
    )
    return TokenOut(token=create_token(user), username=user.username, role=user.role)


@router.post("/auth/login", response=TokenOut)
def login(request, data: LoginIn):
    user = authenticate(username=data.username, password=data.password)
    if not user:
        return router.api.create_response(request, {"detail": "Неверные данные"}, status=401)
    return TokenOut(token=create_token(user), username=user.username, role=user.role)

@router.get("/computers", response=List[ComputerOut])
def List_computers(request):
    return list(Computer.objects.all())


@router.post("/computers", response=ComputerOut, auth=AdminBearer())
def create_computer(request, data: ComputerIn):
    return Computer.objects.create(**data.dict())


@router.put("/computers/{cid}", response=ComputerOut, auth=AdminBearer())
def update_computer(request, cid: int, data: ComputerIn):
    comp = Computer.objects.get(id=cid)
    for k, v in data.dict().items():
        setattr(comp, k, v)
    comp.save()
    return comp


@router.delete("/computers/{cid}", auth=AdminBearer())
def delete_computer(request, cid: int):
    Computer.objects.filter(id=cid).delete()
    return {"success": True}

def serialize_booking(b: Booking) -> dict:
    return {
        "id": b.id,
        "computer_id": b.computer_id,
        "computer_name": b.computer.name,
        "user_name": b.user.username,
        "start_time": b.start_time,
        "end_time": b.end_time,
        "status": b.status,
    }


@router.get("/bookings", response=List[BookingOut], auth=AuthBearer())
def List_bookings(request):
    qs = Booking.objects.select_related("computer", "user")
    if not request.user.is_admin:
        qs = qs.filter(user=request.user)
    return [serialize_booking(b) for b in qs]


@router.post("/bookings", response=BookingOut, auth=AuthBearer())
def create_booking(request, data: BookingIn):
    conflict = Booking.objects.filter(
        computer_id=data.computer_id, status="Активный",
        start_time__lt=data.end_time, end_time__gt=data.start_time,
    ).exists()
    if conflict:
        return router.api.create_response(
            request, {"detail": "Это время уже занято"}, status=400)
    booking = Booking.objects.create(
        user=request.user,
        computer_id=data.computer_id,
        start_time=data.start_time,
        end_time=data.end_time,
    )
    return serialize_booking(booking)


@router.post("/bookings/{bid}/cancel", response=BookingOut, auth=AuthBearer())
def cancel_booking(request, bid: int):
    booking = Booking.objects.select_related("computer", "user").get(id=bid)
    if not request.user.is_admin and booking.user_id != request.user.id:
        return router.api.create_response(request, {"detail": "Нет прав"}, status=403)
    booking.status = "cancelled"
    booking.save()
    return serialize_booking(booking)