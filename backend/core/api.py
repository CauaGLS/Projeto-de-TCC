from app.api import router as app_router
from ninja import NinjaAPI

from .auth import AuthBearer

class API(NinjaAPI):
    def get_openapi_operation_id(self, operation) -> str:
        name = operation.view_func.__name__
        return name.replace(".", "_")

api = API(title="Financial Control API", version="1.0.0", auth=AuthBearer())

api.add_router("/", app_router)