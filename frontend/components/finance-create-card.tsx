// components/finance-create-card.tsx
"use client"

import { useState, useEffect } from "react"
import { useCreateFinance } from "@/hooks/useCreateFinance"
import { useUpdateFinance } from "@/hooks/useUpdateFinance"
import type { CreateFinanceData, FinanceSchema, FinanceType, FinanceStatus } from "@/services/types.gen"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

type FormData = CreateFinanceData["requestBody"]

export function FinanceCreateCard({
  onClose,
  finance,
}: {
  onClose: () => void
  finance?: FinanceSchema
}) {
  const { mutate: create, isPending: creating } = useCreateFinance()
  const { mutate: update, isPending: updating } = useUpdateFinance()

  const [form, setForm] = useState<FormData>({
    title: "",
    description: "",
    value: 0,
    date: new Date().toISOString().slice(0, 10),
    category: "",
    type: "Despesa" as FinanceType,
    status: "Pendente" as FinanceStatus,
  })

  const [displayValue, setDisplayValue] = useState("0,00")

  useEffect(() => {
    if (finance) {
      const value = Number(finance.value)
      setForm({
        title: finance.title,
        description: finance.description ?? "",
        value: value,
        date: finance.date,
        category: finance.category,
        type: finance.type as FinanceType,
        status: finance.status as FinanceStatus,
      })
      setDisplayValue(formatCurrency(value))
    } else {
      setDisplayValue("0,00")
    }
  }, [finance])

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  function parseCurrency(value: string): number {
    // Remove pontos (separadores de milhar) e substitui vírgula por ponto
    const cleanValue = value.replace(/\./g, '').replace(',', '.')
    return parseFloat(cleanValue) || 0
  }

  function handleCurrencyChange(e: React.ChangeEvent<HTMLInputElement>) {
    let rawValue = e.target.value
    
    // Remove tudo que não é número, vírgula ou ponto
    rawValue = rawValue.replace(/[^\d,.]/g, '')
    
    // Permite apenas uma vírgula ou ponto decimal
    const hasDecimal = rawValue.includes(',') || rawValue.includes('.')
    if (hasDecimal) {
      // Substitui ponto por vírgula (padrão brasileiro)
      rawValue = rawValue.replace('.', ',')
      
      // Remove vírgulas adicionais após a primeira
      const firstCommaIndex = rawValue.indexOf(',')
      if (firstCommaIndex !== -1) {
        rawValue = rawValue.substring(0, firstCommaIndex + 1) + 
                  rawValue.substring(firstCommaIndex + 1).replace(/,/g, '')
      }
      
      // Limita a duas casas decimais
      const parts = rawValue.split(',')
      if (parts[1] && parts[1].length > 2) {
        rawValue = `${parts[0]},${parts[1].slice(0, 2)}`
      }
    }
    
    // Remove zeros à esquerda
    if (rawValue.startsWith('0') && rawValue.length > 1 && rawValue[1] !== ',') {
      rawValue = rawValue.substring(1)
    }
    
    // Se começar com vírgula, adiciona zero antes
    if (rawValue.startsWith(',')) {
      rawValue = '0' + rawValue
    }
    
    setDisplayValue(rawValue)
    
    // Atualiza o valor numérico no form
    const numericValue = parseCurrency(rawValue || "0")
    setForm(prev => ({
      ...prev,
      value: numericValue,
    }))
  }

  function handleCurrencyBlur() {
    if (!displayValue || displayValue === "0") {
      const formatted = formatCurrency(0)
      setDisplayValue(formatted)
      setForm(prev => ({ ...prev, value: 0 }))
    } else {
      const numericValue = parseCurrency(displayValue)
      const formatted = formatCurrency(numericValue)
      setDisplayValue(formatted)
      setForm(prev => ({ ...prev, value: numericValue }))
    }
  }

  function handleCurrencyFocus() {
    if (displayValue === "0,00" || displayValue === "0") {
      setDisplayValue("")
    } else {
      // Remove formatação para edição
      const numericValue = parseCurrency(displayValue)
      setDisplayValue(numericValue.toFixed(2).replace('.', ','))
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    if (name !== "value") {
      setForm(prev => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  function handleSelectChange(name: string, value: string) {
    setForm(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (finance) {
      update({ id: finance.id, data: form }, { onSuccess: onClose })
    } else {
      create(form, { onSuccess: onClose })
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {finance ? "Editar Registro" : "Novo Registro"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Título"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">Valor (R$)</Label>
            <Input
              id="value"
              name="value"
              value={displayValue}
              onChange={handleCurrencyChange}
              onBlur={handleCurrencyBlur}
              onFocus={handleCurrencyFocus}
              placeholder="0,00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              name="date"
              type="date"
              value={form.date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Input
              id="category"
              name="category"
              value={form.category}
              onChange={handleChange}
              placeholder="Categoria"
              required
            />
          </div>

          {/* Campos Tipo e Status lado a lado */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select
                value={form.type}
                onValueChange={(value) => handleSelectChange("type", value)}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Despesa">Despesa</SelectItem>
                  <SelectItem value="Receita">Receita</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) => handleSelectChange("status", value)}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Pago">Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={creating || updating}
              className="flex-1"
            >
              {creating || updating ? "Salvando..." : finance ? "Salvar Alterações" : "Criar"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}