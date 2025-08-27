from ninja.security import HttpBearer
from django.contrib.auth.models import User

class AuthBearer(HttpBearer):
    def authenticate(self, request, token):
        if token == "supersecret":
            return User.objects.first()
        return None