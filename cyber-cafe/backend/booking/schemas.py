from datetime import datetime
from decimal import Decimal
from typing import Optional
from ninja import Schema


class RegisterIn(Schema):
    username: str
    password: str
    email: str = ""


class LoginIn(Schema):
    username: str
    password: str


class TokenOut(Schema):
    token: str
    username: str
    role: str


class ComputerIn(Schema):
    name: str
    specs: str = ""
    price_per_hour: Decimal
    status: str = "available"


class ComputerOut(Schema):
    id: int
    name: str
    specs: str
    price_per_hour: Decimal
    status: str


class BookingIn(Schema):
    computer_id: int
    start_time: datetime
    end_time: datetime


class BookingOut(Schema):
    id: int
    computer_id: int
    computer_name: str
    user_name: str
    start_time: datetime
    end_time: datetime
    status: str