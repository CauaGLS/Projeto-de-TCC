from django.shortcuts import get_object_or_404
from ninja import Router, PatchDict
from typing import List

from .models import Finance, SpendingLimit
from .schemas import CreateFinanceSchema, FinanceSchema, DetailFinanceSchema, CreateOrUpdateSpendingLimitSchema, SpendingLimitSchema
from .types import FinanceType
from core.auth import AuthBearer

router = Router(tags=["Finances"], auth=AuthBearer())



#==============Finanças=================

# Listar todos os registros
@router.get("/finances", response=List[FinanceSchema])
def get_finances(request):
    return Finance.objects.select_related("created_by").all()

# Criar novo registro
@router.post("/finances", response=FinanceSchema)
def create_finance(request, finance: CreateFinanceSchema):
    payload = finance.dict()
    return Finance.objects.create(**payload, created_by=request.auth)

# Detalhar registro por ID
@router.get("/finances/{finance_id}", response=DetailFinanceSchema)
def get_finance(request, finance_id: int):
    return get_object_or_404(Finance, id=finance_id)

# Atualizar registro
@router.put("/finances/{finance_id}", response=FinanceSchema)
def update_finance(request, finance_id: int, payload: PatchDict[CreateFinanceSchema]):
    finance = get_object_or_404(Finance, id=finance_id)
    for attr, value in payload.items():
        setattr(finance, attr, value)
    finance.save()
    return finance

# Excluir registro (remoção definitiva, sem arquivar)
@router.delete("/finances/{finance_id}", response={204: None})
def delete_finance(request, finance_id: int):
    finance = get_object_or_404(Finance, id=finance_id)
    finance.delete()
    return 204, None

# Filtro por tipo (opcional, mas útil para relatórios)
@router.get("/finances/type/{finance_type}", response=List[FinanceSchema])
def get_finances_by_type(request, finance_type: FinanceType):
    return Finance.objects.filter(type=finance_type).select_related("created_by")

# Filtro por categoria (também opcional)
@router.get("/finances/category/{category}", response=List[FinanceSchema])
def get_finances_by_category(request, category: str):
    return Finance.objects.filter(category=category).select_related("created_by")



#==============Limites de Gastos=================

# Obter limite atual do usuário
@router.get("/spending-limit", response=SpendingLimitSchema)
def get_spending_limit(request):
    limit, created = SpendingLimit.objects.get_or_create(
        user=request.auth,
        defaults={"value": 1000.00}
    )
    return limit

# Definir ou atualizar limite
@router.post("/spending-limit", response=SpendingLimitSchema)
def set_spending_limit(request, payload: CreateOrUpdateSpendingLimitSchema):
    limit, created = SpendingLimit.objects.update_or_create(
        user=request.auth,
        defaults={"value": payload.value}
    )
    return limit
