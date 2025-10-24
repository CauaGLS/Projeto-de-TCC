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
    image = models.TextField(null=True, blank=True)
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
    access_token = models.TextField(null=True)
    refresh_token = models.TextField(null=True)
    access_token_expires_at = models.DateTimeField(null=True)
    refresh_token_expires_at = models.DateTimeField(null=True)
    scope = models.TextField(null=True)
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
    value = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateField(blank=True, null=True)
    due_date = models.DateField(blank=True, null=True)
    category = models.CharField(max_length=45)
    type = models.CharField(
        max_length=10,
        choices=[(t.value, t.value) for t in FinanceType]
    )
    status = models.CharField(
        max_length=15,
        choices=[(s.value, s.value) for s in FinanceStatus],
        default=FinanceStatus.PENDING
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    created_by = models.ForeignKey(User, on_delete=models.CASCADE)

    def save(self, *args, **kwargs):
        from datetime import date
        if self.status == FinanceStatus.PENDING:
            self.payment_date = None
        if (
            self.due_date
            and self.due_date < date.today()
            and self.status not in [FinanceStatus.PAID, FinanceStatus.OVERDUE]
        ):
            self.status = FinanceStatus.OVERDUE
        super().save(*args, **kwargs)

    class Meta:
        db_table = "finances"
        ordering = ["-payment_date", "created_at"]


class SpendingLimit(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="spending_limit")
    value = models.DecimalField(max_digits=10, decimal_places=2, default=1000.00, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "spending_limits"

    def __str__(self):
        return f"Limite de {self.user.email}: {self.value or 'Sem limite'}"


class FinanceAttachment(models.Model):
    finance = models.ForeignKey(Finance, on_delete=models.CASCADE, related_name="attachments")
    file = models.FileField(upload_to="finances")
    name = models.CharField(max_length=255, null=True, blank=True)
    content_type = models.CharField(max_length=255, null=True, blank=True)
    size = models.IntegerField(null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    class Meta:
        db_table = "finance_attachments"


class Goal(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="goals")
    title = models.CharField(max_length=100)
    target_value = models.DecimalField(max_digits=10, decimal_places=2)
    current_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    deadline = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "goals"
        ordering = ["-created_at"]

    @property
    def progress(self):
        if not self.target_value or self.target_value == 0:
            return 0.0
        return float(self.current_value) / float(self.target_value) * 100


class GoalRecord(models.Model):
    goal = models.ForeignKey(Goal, on_delete=models.CASCADE, related_name="records")
    title = models.CharField(max_length=100)
    value = models.DecimalField(max_digits=10, decimal_places=2)
    type = models.CharField(max_length=10, choices=[("Adicionar", "Adicionar"), ("Retirar", "Retirar")])
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "goal_records"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        total = sum(
            record.value if record.type == "Adicionar" else -record.value
            for record in self.goal.records.all()
        )
        self.goal.current_value = total
        self.goal.save()
