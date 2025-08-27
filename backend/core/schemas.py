from django.contrib.auth.models import User
from ninja import ModelSchema

class UserSchema(ModelSchema):
    class Config:
        model = User
        model_fields = "__all__"