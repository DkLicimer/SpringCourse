import jwt
from datetime import datetime, timedelta, timezone
from django.conf import settings
from ninja.security import HttpBearer
from .models import User


def create_token(user):
    payload = {
        "user_id": user.id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")


class AuthBearer(HttpBearer):
    def authenticate(self, request, token):
        try:
            payload = jwt.decode(
                token, settings.JWT_SECRET, algorithms=["HS256"]
            )
            user = User.objects.get(id=payload["user_id"])

            if not user.is_active:
                return None

            request.user = user
            return user
        except (jwt.PyJWTError, User.DoesNotExist):
            return None


class AdminBearer(AuthBearer):
    def authenticate(self, request, token):
        user = super().authenticate(request, token)

        if user is None or not user.is_admin:
            return None

        return user