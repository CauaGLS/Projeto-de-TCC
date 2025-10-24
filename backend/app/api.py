from django.shortcuts import get_object_or_404
from django.core.files.storage import default_storage
from ninja import Router, PatchDict, File
from ninja.files import UploadedFile
from ninja.errors import HttpError
from typing import List, Optional
from decimal import Decimal
from .models import Finance, SpendingLimit, FinanceAttachment, Goal, GoalRecord
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
)
from core.auth import AuthBearer

router = Router(tags=["Finances"], auth=AuthBearer())


# ========= Finanças =========

@router.get("/finances", response=List[FinanceSchema])
def get_finances(request):
    return Finance.objects.select_related("created_by").all()


@router.post("/finances", response=FinanceSchema)
def create_finance(request, finance: CreateFinanceSchema, goal_id: Optional[int] = None):
    payload = finance.dict()
    finance_obj = Finance.objects.create(**payload, created_by=request.auth)

    return finance_obj


@router.get("/finances/{finance_id}", response=DetailFinanceSchema)
def get_finance(request, finance_id: int):
    finance = get_object_or_404(Finance.objects.prefetch_related("attachments"), id=finance_id)

    for attachment in finance.attachments.all():
        attachment.file_url = default_storage.url(attachment.file.name)

    return finance


@router.put("/finances/{finance_id}", response=FinanceSchema)
def update_finance(request, finance_id: int, payload: PatchDict[CreateFinanceSchema]):
    finance = get_object_or_404(Finance, id=finance_id)
    for attr, value in payload.items():
        setattr(finance, attr, value)
    finance.save()
    return finance


@router.delete("/finances/{finance_id}", response={204: None})
def delete_finance(request, finance_id: int):
    finance = get_object_or_404(Finance, id=finance_id)
    finance.delete()
    return 204, None


# ========= Upload de anexos =========

@router.post("/finances/{finance_id}/attachments", response=List[FinanceAttachmentSchema])
def upload_finance_attachments(
    request, finance_id: int, files: List[UploadedFile] = File(...)
):
    finance = get_object_or_404(Finance, id=finance_id)
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
        # gera signed URL
        attachment.file_url = default_storage.url(attachment.file.name)
        uploaded_files.append(attachment)

    return uploaded_files


@router.delete("/attachments/{attachment_id}", response={204: None})
def delete_finance_attachment(request, attachment_id: int):
    attachment = get_object_or_404(FinanceAttachment, id=attachment_id)
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
    limit, created = SpendingLimit.objects.update_or_create(
        user=request.auth,
        defaults={"value": payload.value}
    )
    return limit


@router.delete("/spending-limit", response={204: None})
def delete_spending_limit(request):
    try:
        limit = SpendingLimit.objects.get(user=request.auth)
        limit.delete()
    except SpendingLimit.DoesNotExist:
        pass
    return 204, None


# ========= METAS =========

@router.get("/goals", response=List[GoalSchema])
def list_goals(request):
    return Goal.objects.filter(user=request.auth).prefetch_related("records")


@router.post("/goals", response=GoalSchema)
def create_goal(request, payload: CreateGoalSchema):
    goal = Goal.objects.create(
        user=request.auth,
        title=payload.title,
        target_value=payload.target_value,
        deadline=payload.deadline,
    )
    return goal


@router.get("/goals/{goal_id}", response=GoalSchema)
def get_goal(request, goal_id: int):
    goal = get_object_or_404(
        Goal.objects.prefetch_related("records"),
        id=goal_id,
        user=request.auth,
    )
    return goal


@router.put("/goals/{goal_id}", response=GoalSchema)
def update_goal(request, goal_id: int, payload: CreateGoalSchema):
    goal = get_object_or_404(Goal, id=goal_id, user=request.auth)

    goal.title = payload.title
    goal.target_value = payload.target_value
    goal.deadline = payload.deadline
    goal.save()

    return goal


# ========= EXCLUIR META =========
@router.delete("/goals/{goal_id}", response={204: None})
def delete_goal(request, goal_id: int):
    goal = get_object_or_404(Goal, id=goal_id, user=request.auth)
    goal.delete()
    return 204, None


@router.post("/goals/{goal_id}/records", response=GoalSchema)
def add_goal_record(request, goal_id: int, payload: AddGoalRecordSchema):

    goal = Goal.objects.get(id=goal_id, user=request.auth)
    value = Decimal(str(payload.value))  # ✅ converte float → Decimal

    # Define o título padrão se não vier nada
    record_title = payload.title or f"{payload.type} em {goal.title}"

    # Cria o registro
    GoalRecord.objects.create(
        goal=goal,
        title=record_title,
        value=value,
        type=payload.type,
    )

    # Atualiza o valor atual
    if payload.type == "Adicionar":
        goal.current_value += value
    elif payload.type == "Retirar":
        goal.current_value -= value

    goal.save()
    goal.refresh_from_db()

    # Retorna a meta atualizada
    return goal


# ========= FOTO DE PERFIL =========

@router.post("/user/photo", response=UploadProfilePhotoSchema)
def upload_profile_photo(request, file: UploadedFile = File(...)):
    """
    Faz upload da foto de perfil do usuário autenticado,
    salva no MinIO e atualiza a URL no campo image do modelo User.
    """
    user = request.auth
    if not user:
        # Retorna um erro padrão compatível com Ninja
        raise HttpError(401, "Usuário não autenticado")

    try:
        # Caminho do arquivo no MinIO (automático, sem precisar criar pasta)
        file_path = f"profile_photos/{user.id}/{file.name}"

        # Salva usando o storage padrão (MinIO)
        saved_path = default_storage.save(file_path, file)

        # Gera URL pública
        file_url = default_storage.url(saved_path)

        # Atualiza o usuário com a nova imagem
        user.image = file_url
        user.save(update_fields=["image"])

        # Retorna no formato compatível com o schema
        return {"photo_url": file_url}

    except Exception as e:
        raise HttpError(500, f"Erro ao enviar imagem: {str(e)}")
