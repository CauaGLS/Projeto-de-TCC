from django.shortcuts import get_object_or_404
from django.core.files.storage import default_storage
from ninja import Router, PatchDict, File
from ninja.files import UploadedFile
from ninja.errors import HttpError
from typing import List, Optional
from decimal import Decimal
from django.conf import settings
from .models import Finance, SpendingLimit, FinanceAttachment, Goal, GoalRecord, Family, FamilyMember
from .schemas import (
    CreateFinanceSchema,
    FinanceSchema,
    DetailFinanceSchema,
    CreateOrUpdateSpendingLimitSchema,
    SpendingLimitSchema,
    FinanceAttachmentSchema,
    GoalSchema,
    CreateGoalSchema,
    AddGoalRecordSchema,
    UploadProfilePhotoSchema,
    FamilySchema,
    CreateFamilySchema,
    JoinFamilySchema,
)
from core.auth import AuthBearer
from core.schemas import UserSchema
from app.storage_backend import PublicMediaStorage

router = Router(tags=["Finances"], auth=AuthBearer())


# ========= Funções auxiliares =========

def get_user_family(request):
    """Retorna a família do usuário autenticado (se houver)."""
    membership = FamilyMember.objects.filter(user=request.auth).select_related("family").first()
    return membership.family if membership else None


def get_user_image_url(user):
    """Retorna a URL completa da imagem do usuário (caso exista)."""
    if not user.image:
        return None

    # Se já for uma URL completa (Google, GitHub, etc.), retorna direto
    if user.image.startswith("http://") or user.image.startswith("https://"):
        return user.image

    try:
        return default_storage.url(user.image)
    except Exception:
        return None


# ========= Finanças =========

@router.get("/finances", response=List[FinanceSchema])
def get_finances(request):
    user = request.auth

    family_member = FamilyMember.objects.filter(user=user).select_related("family").first()

    if family_member:
        family_users = FamilyMember.objects.filter(family=family_member.family).values_list("user", flat=True)
        finances = Finance.objects.filter(created_by__in=family_users).select_related("created_by")
    else:
        finances = Finance.objects.filter(created_by=user).select_related("created_by")

    return finances


@router.post("/finances", response=FinanceSchema)
def create_finance(request, finance: CreateFinanceSchema, goal_id: Optional[int] = None):
    payload = finance.dict()
    finance_obj = Finance.objects.create(**payload, created_by=request.auth)
    return finance_obj


@router.get("/finances/{finance_id}", response=DetailFinanceSchema)
def get_finance(request, finance_id: int):
    finance = get_object_or_404(Finance.objects.prefetch_related("attachments"), id=finance_id)

    # Segurança: garante que o usuário tem acesso
    family = get_user_family(request)
    if finance.created_by != request.auth and finance.family != family:
        raise HttpError(403, "Acesso negado")

    for attachment in finance.attachments.all():
        attachment.file_url = default_storage.url(attachment.file.name)

    return finance


@router.put("/finances/{finance_id}", response=FinanceSchema)
def update_finance(request, finance_id: int, payload: PatchDict[CreateFinanceSchema]):
    finance = get_object_or_404(Finance, id=finance_id)
    family = get_user_family(request)
    if finance.created_by != request.auth and finance.family != family:
        raise HttpError(403, "Acesso negado")

    for attr, value in payload.items():
        setattr(finance, attr, value)
    finance.save()
    return finance


@router.delete("/finances/{finance_id}", response={204: None})
def delete_finance(request, finance_id: int):
    finance = get_object_or_404(Finance, id=finance_id)
    family = get_user_family(request)
    if finance.created_by != request.auth and finance.family != family:
        raise HttpError(403, "Acesso negado")

    finance.delete()
    return 204, None


# ========= Upload de anexos =========

@router.post("/finances/{finance_id}/attachments", response=List[FinanceAttachmentSchema])
def upload_finance_attachments(request, finance_id: int, files: List[UploadedFile] = File(...)):
    finance = get_object_or_404(Finance, id=finance_id)
    family = get_user_family(request)
    if finance.created_by != request.auth and finance.family != family:
        raise HttpError(403, "Acesso negado")

    uploaded_files = []
    for file in files:
        attachment = FinanceAttachment.objects.create(
            finance=finance,
            file=file,
            name=file.name or "",
            content_type=file.content_type or "application/octet-stream",
            size=file.size or 0,
            created_by=request.auth,
        )
        attachment.file_url = default_storage.url(attachment.file.name)
        uploaded_files.append(attachment)

    return uploaded_files


@router.delete("/attachments/{attachment_id}", response={204: None})
def delete_finance_attachment(request, attachment_id: int):
    attachment = get_object_or_404(FinanceAttachment, id=attachment_id)
    finance = attachment.finance
    family = get_user_family(request)
    if finance.created_by != request.auth and finance.family != family:
        raise HttpError(403, "Acesso negado")

    attachment.delete()
    return 204, None


# ========= Limites de Gastos =========

@router.get("/spending-limit", response=Optional[SpendingLimitSchema])
def get_spending_limit(request):
    try:
        return SpendingLimit.objects.get(user=request.auth)
    except SpendingLimit.DoesNotExist:
        return None


@router.post("/spending-limit", response=SpendingLimitSchema)
def set_spending_limit(request, payload: CreateOrUpdateSpendingLimitSchema):
    limit, _ = SpendingLimit.objects.update_or_create(
        user=request.auth,
        defaults={"value": payload.value},
    )
    return limit


@router.delete("/spending-limit", response={204: None})
def delete_spending_limit(request):
    SpendingLimit.objects.filter(user=request.auth).delete()
    return 204, None


# ========= Metas =========

@router.get("/goals", response=List[GoalSchema])
def list_goals(request):
    user = request.auth
    family_member = FamilyMember.objects.filter(user=user).select_related("family").first()

    if family_member:
        family_users = FamilyMember.objects.filter(family=family_member.family).values_list("user", flat=True)
        goals = Goal.objects.filter(user__in=family_users).prefetch_related("records")
    else:
        goals = Goal.objects.filter(user=user).prefetch_related("records")

    return goals


@router.post("/goals", response=GoalSchema)
def create_goal(request, payload: CreateGoalSchema):
    family = get_user_family(request)
    goal = Goal.objects.create(
        user=request.auth,
        title=payload.title,
        target_value=payload.target_value,
        deadline=payload.deadline,
        family=family,
    )
    return goal


@router.get("/goals/{goal_id}", response=GoalSchema)
def get_goal(request, goal_id: int):
    goal = get_object_or_404(Goal.objects.prefetch_related("records"), id=goal_id)
    family = get_user_family(request)
    if goal.user != request.auth and goal.family != family:
        raise HttpError(403, "Acesso negado")
    return goal


@router.put("/goals/{goal_id}", response=GoalSchema)
def update_goal(request, goal_id: int, payload: CreateGoalSchema):
    goal = get_object_or_404(Goal, id=goal_id)
    family = get_user_family(request)
    if goal.user != request.auth and goal.family != family:
        raise HttpError(403, "Acesso negado")

    goal.title = payload.title
    goal.target_value = payload.target_value
    goal.deadline = payload.deadline
    goal.save()
    return goal


@router.delete("/goals/{goal_id}", response={204: None})
def delete_goal(request, goal_id: int):
    goal = get_object_or_404(Goal, id=goal_id)
    family = get_user_family(request)
    if goal.user != request.auth and goal.family != family:
        raise HttpError(403, "Acesso negado")

    goal.delete()
    return 204, None


@router.post("/goals/{goal_id}/records", response=GoalSchema)
def add_goal_record(request, goal_id: int, payload: AddGoalRecordSchema):
    goal = get_object_or_404(Goal, id=goal_id)
    family = get_user_family(request)
    if goal.user != request.auth and goal.family != family:
        raise HttpError(403, "Acesso negado")

    value = Decimal(str(payload.value))
    record_title = payload.title or f"{payload.type} em {goal.title}"

    GoalRecord.objects.create(
        goal=goal,
        title=record_title,
        value=value,
        type=payload.type,
    )

    goal.refresh_from_db()
    return goal


# ========= Foto de perfil =========

@router.post("/user/photo", response=UploadProfilePhotoSchema)
def upload_profile_photo(request, file: UploadedFile = File(...)):
    user = request.auth
    if not user:
        raise HttpError(401, "Usuário não autenticado")

    try:
        # Usa o storage público
        storage = PublicMediaStorage()

        # caminho relativo dentro do bucket (sem duplicar o prefixo)
        file_path = f"{user.id}/{file.name}"

        # salva no bucket na pasta 'profile_photos'
        saved_path = storage.save(file_path, file)

        # gera URL pública permanente (funciona no MinIO local)
        file_url = f"{settings.AWS_S3_ENDPOINT_URL.replace('http://', '').replace('https://', '')}/{settings.AWS_STORAGE_BUCKET_NAME}/{storage.location}/{saved_path}"
        file_url = f"http://{file_url}"

        user.image = file_url
        user.save(update_fields=["image"])

        return {"photo_url": file_url}

    except Exception as e:
        raise HttpError(500, f"Erro ao enviar imagem: {str(e)}")


# ========= Família =========

@router.post("/family", response=FamilySchema)
def create_family(request, payload: CreateFamilySchema):
    family = Family.objects.create(name=payload.name, created_by=request.auth)
    FamilyMember.objects.create(family=family, user=request.auth)
    return family


@router.get("/family", response=Optional[FamilySchema])
def get_family(request):
    return get_user_family(request)


@router.post("/family/join", response=FamilySchema)
def join_family(request, payload: JoinFamilySchema):
    try:
        family = Family.objects.get(code=payload.code.upper())
    except Family.DoesNotExist:
        raise HttpError(404, "Código de família inválido")

    FamilyMember.objects.get_or_create(family=family, user=request.auth)
    return family


@router.get("/family/users", response=List[UserSchema])
def list_family_users(request):
    family = get_user_family(request)
    if not family:
        return []

    users = []
    for member in family.members.select_related("user"):
        user = member.user
        user.image = get_user_image_url(user)
        users.append(user)
    return users


@router.post("/family/leave", response={204: None})
def leave_family(request):
    membership = FamilyMember.objects.filter(user=request.auth).first()
    if not membership:
        raise HttpError(404, "Você não pertence a nenhuma família.")

    family = membership.family
    if family.created_by == request.auth:
        members_count = FamilyMember.objects.filter(family=family).count()
        if members_count > 1:
            raise HttpError(400, "O criador não pode sair enquanto houver outros membros.")
        else:
            family.delete()
            return 204, None

    membership.delete()
    return 204, None


@router.delete("/family/remove/{user_id}", response={204: None})
def remove_family_member(request, user_id: str):
    membership = FamilyMember.objects.filter(user=request.auth).select_related("family").first()
    if not membership:
        raise HttpError(403, "Você não pertence a nenhuma família.")

    family = membership.family
    if family.created_by != request.auth:
        raise HttpError(403, "Apenas o criador da família pode remover membros.")

    if request.auth.id == user_id:
        raise HttpError(400, "Você não pode se remover por este método. Use /family/leave.")

    member_to_remove = FamilyMember.objects.filter(family=family, user_id=user_id).first()
    if not member_to_remove:
        raise HttpError(404, "Usuário não encontrado na família.")

    member_to_remove.delete()
    return 204, None
