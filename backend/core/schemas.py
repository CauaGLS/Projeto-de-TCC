from app.models import User
from ninja import ModelSchema

class UserSchema(ModelSchema):
    id: str
    class Meta:
        model = User
        fields = ["id", "name", "email", "image"]