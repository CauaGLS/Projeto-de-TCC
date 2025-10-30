from app.models import Session
from django.utils import timezone
from ninja.security import HttpBearer
from ninja.errors import HttpError

class AuthBearer(HttpBearer):
    def authenticate(self, request, token):
        try:
            session = Session.objects.select_related("user").get(token=token)
        except Session.DoesNotExist:
            raise HttpError(401, "Sessão inválida ou expirada")
        
        if not session:
            return None
        
        if session.expires_at < timezone.now():
            return None
        
        return session.user