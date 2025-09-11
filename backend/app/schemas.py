from datetime import date
from ninja import ModelSchema, Schema
from typing import Optional
from .models import Finance, SpendingLimit
from .types import FinanceType, FinanceStatus
from core.schemas import UserSchema

class FinanceSchema(ModelSchema):
    id: int
    created_by: UserSchema
    type: FinanceType
    status: FinanceStatus
    due_date: Optional[date]

    class Config:
        model = Finance
        model_fields = "__all__"

class DetailFinanceSchema(ModelSchema):
    id: int
    created_by: UserSchema
    type: FinanceType
    status: FinanceStatus
    due_date: Optional[date]

    class Config:
        model = Finance
        model_fields = "__all__"

class CreateFinanceSchema(Schema):
    title: str
    description: Optional[str] = None
    value: float
    payment_date: Optional[date] = None
    due_date: Optional[date] = None
    category: str
    type: FinanceType = FinanceType.EXPENSE
    status: FinanceStatus = FinanceStatus.PENDING

class SpendingLimitSchema(ModelSchema):
    class Config:
        model = SpendingLimit
        model_fields = ["id", "user", "value", "created_at", "updated_at"]

class CreateOrUpdateSpendingLimitSchema(Schema):
    value: float
