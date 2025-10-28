from app.models import User
from ninja import ModelSchema
from typing import Optional

class UserSchema(ModelSchema):
    id: str
    image: Optional[str] = None
    class Meta:
        model = User
        fields = ["id", "name", "email", "image"]