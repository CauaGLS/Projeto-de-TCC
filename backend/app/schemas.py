from datetime import date, datetime
from ninja import ModelSchema, Schema
from typing import Optional, List
from .models import Finance, SpendingLimit, FinanceAttachment
from .types import FinanceType, FinanceStatus
from core.schemas import UserSchema


class FinanceAttachmentSchema(ModelSchema):
    id: int
    created_by: Optional[UserSchema]
    uploaded_at: datetime
    file_url: Optional[str] = None  # URL temporária gerada no backend

    class Config:
        model = FinanceAttachment
        model_fields = ["id", "name", "content_type", "size", "uploaded_at"]


class FinanceSchema(ModelSchema):
    id: int
    created_by: UserSchema
    type: FinanceType
    status: FinanceStatus
    due_date: Optional[date]
    payment_date: Optional[date]
    created_at: datetime
    updated_at: datetime

    class Config:
        model = Finance
        model_fields = "__all__"


class DetailFinanceSchema(ModelSchema):
    id: int
    created_by: UserSchema
    type: FinanceType
    status: FinanceStatus
    due_date: Optional[date]
    payment_date: Optional[date]
    created_at: datetime
    updated_at: datetime
    attachments: List[FinanceAttachmentSchema] = []

    class Config:
        model = Finance
        model_fields = "__all__"


class CreateFinanceSchema(Schema):
    title: str
    value: float
    payment_date: Optional[date] = None
    due_date: Optional[date] = None
    category: str
    type: FinanceType = FinanceType.EXPENSE
    status: FinanceStatus = FinanceStatus.PENDING


class SpendingLimitSchema(ModelSchema):
    id: int
    user: UserSchema
    value: Optional[float]
    created_at: datetime
    updated_at: datetime

    class Config:
        model = SpendingLimit
        model_fields = "__all__"


class CreateOrUpdateSpendingLimitSchema(Schema):
    value: Optional[float]
