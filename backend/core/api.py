from app.api import router as app_router
from ninja import NinjaAPI

from .auth import AuthBearer

api = NinjaAPI(title="API", version="1.0.0", auth=AuthBearer())

api.add_router("/", app_router)