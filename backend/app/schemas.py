from ninja import Schema, ModelSchema
from .models import Finances
from core.schemas import UserSchema


class FinanceSchema(ModelSchema):
    created_by: UserSchema

    class Config:
        model = Finances
        model_fields = "__all__"

class FinanceCreateSchema(Schema):
    title: str
    value: float
    date: str
    category: str
    type: str
    status: str
    description: str | None = None
