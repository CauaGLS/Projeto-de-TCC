from datetime import date
from ninja import ModelSchema, Schema
from typing import Optional
from .models import Finance
from .types import FinanceType, FinanceStatus
from core.schemas import UserSchema

class FinanceSchema(ModelSchema):
    id: int
    created_by: UserSchema
    type: FinanceType
    status: FinanceStatus

    class Config:
        model = Finance
        model_fields = "__all__"

class DetailFinanceSchema(ModelSchema):
    id: int
    created_by: UserSchema
    type: FinanceType
    status: FinanceStatus

    class Config:
        model = Finance
        model_fields = "__all__"

class CreateFinanceSchema(Schema):
    title: str
    description: Optional[str] = None
    value: float
    date: date
    category: str
    type: FinanceType = FinanceType.EXPENSE
    status: FinanceStatus = FinanceStatus.PENDING