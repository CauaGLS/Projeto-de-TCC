from django.shortcuts import get_object_or_404
from django.core.files.storage import default_storage
from ninja import Router, PatchDict, File
from ninja.files import UploadedFile
from typing import List, Optional

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

    if finance.type == "Meta" and goal_id:
        record_type = payload.get("record_type", "Adicionar")
        goal = get_object_or_404(Goal, id=goal_id, user=request.auth)
        GoalRecord.objects.create(
            goal=goal,
            title=finance.title,
            value=finance.value,
            type=record_type,
            finance=finance_obj
        )

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


@router.put("/goals/{goal_id}", response=GoalSchema)
def update_goal(request, goal_id: int, payload: CreateGoalSchema):
    goal = get_object_or_404(Goal, id=goal_id, user=request.auth)
    goal.title = payload.title
    goal.target_value = payload.target_value
    goal.deadline = payload.deadline
    goal.save()
    return goal


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
    return Goal.objects.create(
        user=request.auth,
        title=payload.title,
        target_value=payload.target_value,
        deadline=payload.deadline
    )


@router.get("/goals/{goal_id}", response=GoalSchema)
def get_goal(request, goal_id: int):
    goal = get_object_or_404(Goal.objects.prefetch_related("records"), id=goal_id, user=request.auth)
    return goal


@router.delete("/goals/{goal_id}", response={204: None})
def delete_goal(request, goal_id: int):
    goal = get_object_or_404(Goal, id=goal_id, user=request.auth)
    goal.delete()
    return 204, None


@router.post("/goals/{goal_id}/records", response=GoalSchema)
def add_goal_record(request, goal_id: int, payload: dict):
    goal = get_object_or_404(Goal, id=goal_id, user=request.auth)
    record_type = payload.get("type", "Adicionar")
    value = float(payload.get("value", 0))
    title = payload.get("title", f"{record_type} em {goal.title}")

    GoalRecord.objects.create(goal=goal, title=title, value=value, type=record_type)

    goal.refresh_from_db()
    return goal

