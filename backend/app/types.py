from enum import Enum

class FinanceType(str, Enum):
    INCOME = "Receita"
    EXPENSE = "Despesa"

class FinanceStatus(str, Enum):
    PENDING = "Pendente"
    PAID = "Pago"
    OVERDUE = "Atrasada"