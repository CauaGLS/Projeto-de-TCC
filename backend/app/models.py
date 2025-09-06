from django.db import models
from django.contrib.auth.models import AbstractBaseUser
from .types import FinanceType, FinanceStatus


class User(AbstractBaseUser):
    username = None
    password = None

    id = models.CharField(primary_key=True, max_length=36)
    name = models.CharField(max_length=255, blank=True)
    email = models.EmailField(unique=True)
    email_verified = models.BooleanField(default=False)
    image = models.URLField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    class Meta:
        db_table = "users"
        verbose_name = "user"
        verbose_name_plural = "users"

    def __str__(self) -> str:
        return self.name


class Session(models.Model):
    id = models.CharField(primary_key=True, max_length=36)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    token = models.CharField(max_length=255)
    expires_at = models.DateTimeField()
    ip_address = models.CharField(max_length=255, null=True)
    user_agent = models.CharField(max_length=255, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "sessions"


class Account(models.Model):
    id = models.CharField(primary_key=True, max_length=36)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    account_id = models.CharField(max_length=255)
    provider_id = models.CharField(max_length=255)
    access_token = models.CharField(max_length=255, null=True)
    refresh_token = models.CharField(max_length=255, null=True)
    access_token_expires_at = models.DateTimeField(null=True)
    refresh_token_expires_at = models.DateTimeField(null=True)
    scope = models.CharField(max_length=255, null=True)
    id_token = models.TextField(null=True)
    password = models.CharField(max_length=255, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "accounts"


class Verification(models.Model):
    id = models.CharField(primary_key=True, max_length=36)
    identifier = models.TextField()
    value = models.TextField()
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "verifications"



class Finance(models.Model):
    title = models.CharField(max_length=50)
    description = models.CharField(max_length=100, blank=True, null=True)
    value = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField()
    category = models.CharField(max_length=45)
    type = models.CharField(
        max_length=10,
        choices=[(t.value, t.value) for t in FinanceType]
    )
    status = models.CharField(
        max_length=10,
        choices=[(s.value, s.value) for s in FinanceStatus],
        default=FinanceStatus.PENDING
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    created_by = models.ForeignKey(User, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.title} - {self.value}"

    class Meta:
        db_table = "finances"
        verbose_name = "finance"
        verbose_name_plural = "finances"
        ordering = ["-date", "created_at"]
        indexes = [
            models.Index(fields=["type", "category"]),
            models.Index(fields=["date"]),
        ]
