from ninja import Router
from .models import Finances
from django.shortcuts import get_object_or_404
from .schemas import FinanceSchema, FinanceCreateSchema

router = Router()

@router.get("/finances", response=list[FinanceSchema])
def list_finances(request):
    return Finances.objects.selected_related("created_by").all()


@router.get("/finances/{finance_id}", response=FinanceSchema)
def get_finance(request, finance_id: int):
    finance = get_object_or_404(Finances.objects.selected_related("created_by"), id=finance_id)
    return finance


@router.post("/finances", response=FinanceSchema)
def create_finance(request, data: FinanceCreateSchema):
    finance = Finances.objects.create(**data.dict(), created_by=request.auth)
    return finance


@router.put("/finances/{finance_id}", response=FinanceSchema)
def update_finance(request, finance_id: int, data: FinanceSchema):
    finance = get_object_or_404(Finances, id=finance_id)
    for attr, value in data.dict().items():
        setattr(finance, attr, value)
    finance.save()
    return finance


@router.delete("/finances/{finance_id}", response={204: None})
def delete_finance(request, finance_id: int):
    finance = get_object_or_404(Finances, id=finance_id)
    finance.delete()
    return 204