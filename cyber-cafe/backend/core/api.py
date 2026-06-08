from ninja import NinjaAPI
from booking.api import router as booking_router

api = NinjaAPI(title="CyberCafe API")
api.add_router("/", booking_router)