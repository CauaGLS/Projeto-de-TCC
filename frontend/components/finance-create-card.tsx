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
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

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
    value: 0,
    payment_date: null,
    due_date: null,
    category: "",
    type: "Despesa" as FinanceType,
    status: "Pendente" as FinanceStatus,
  })

  const [hasDueDate, setHasDueDate] = useState<boolean>(!!form.due_date)
  const [displayValue, setDisplayValue] = useState("0,00")

  useEffect(() => {
    if (finance) {
      const value = Number(finance.value)
      setForm({
        title: finance.title,
        value: value,
        payment_date: finance.payment_date ?? null,
        due_date: finance.due_date ?? null,
        category: finance.category,
        type: finance.type as FinanceType,
        status: finance.status as FinanceStatus,
      })
      setDisplayValue(formatCurrency(value))
      setHasDueDate(!!finance.due_date)
    } else {
      setDisplayValue("0,00")
      setHasDueDate(false)
    }
  }, [finance])

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  function parseCurrency(value: string): number {
    const cleanValue = value.replace(/\./g, "").replace(",", ".")
    return parseFloat(cleanValue) || 0
  }

  function handleCurrencyChange(e: React.ChangeEvent<HTMLInputElement>) {
    let rawValue = e.target.value
    rawValue = rawValue.replace(/[^\d,.]/g, "")
    const hasDecimal = rawValue.includes(",") || rawValue.includes(".")
    if (hasDecimal) {
      rawValue = rawValue.replace(".", ",")
      const firstCommaIndex = rawValue.indexOf(",")
      if (firstCommaIndex !== -1) {
        rawValue =
          rawValue.substring(0, firstCommaIndex + 1) +
          rawValue.substring(firstCommaIndex + 1).replace(/,/g, "")
      }
      const parts = rawValue.split(",")
      if (parts[1] && parts[1].length > 2) {
        rawValue = `${parts[0]},${parts[1].slice(0, 2)}`
      }
    }
    if (rawValue.startsWith("0") && rawValue.length > 1 && rawValue[1] !== ",") {
      rawValue = rawValue.substring(1)
    }
    if (rawValue.startsWith(",")) {
      rawValue = "0" + rawValue
    }
    setDisplayValue(rawValue)
    const numericValue = parseCurrency(rawValue || "0")
    setForm((prev) => ({
      ...prev,
      value: numericValue,
    }))
  }

  function handleCurrencyBlur() {
    if (!displayValue || displayValue === "0") {
      const formatted = formatCurrency(0)
      setDisplayValue(formatted)
      setForm((prev) => ({ ...prev, value: 0 }))
    } else {
      const numericValue = parseCurrency(displayValue)
      const formatted = formatCurrency(numericValue)
      setDisplayValue(formatted)
      setForm((prev) => ({ ...prev, value: numericValue }))
    }
  }

  function handleCurrencyFocus() {
    if (displayValue === "0,00" || displayValue === "0") {
      setDisplayValue("")
    } else {
      const numericValue = parseCurrency(displayValue)
      setDisplayValue(numericValue.toFixed(2).replace(".", ","))
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    if (name !== "value") {
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  function handleSelectChange(name: string, value: string) {
    setForm((prev) => {
      const updated = { ...prev, [name]: value }
      if (name === "status" && value === "Pendente") {
        updated.payment_date = null
      }
      return updated
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (finance) {
      update({ id: finance.id, data: form }, { onSuccess: onClose })
    } else {
      create(form, { onSuccess: onClose })
    }
  }

  function parseLocalDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split("-").map(Number)
    return new Date(year, month - 1, day)
  }

  const [calendarOpen, setCalendarOpen] = useState<{
    payment_date: boolean
    due_date: boolean
  }>({
    payment_date: false,
    due_date: false,
  })

  const renderDatePicker = (label: string, field: "payment_date" | "due_date") => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover
        open={calendarOpen[field]}
        onOpenChange={(open) =>
          setCalendarOpen((prev) => ({ ...prev, [field]: open }))
        }
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={`w-full justify-start text-left font-normal ${
              !form[field] && "text-muted-foreground"
            }`}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {form[field]
              ? format(parseLocalDate(form[field] as string), "dd/MM/yyyy", { locale: ptBR })
              : "Selecione uma data"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={form[field] ? parseLocalDate(form[field] as string) : undefined}
            onSelect={(date) => {
              if (date) {
                const year = date.getFullYear()
                const month = String(date.getMonth() + 1).padStart(2, "0")
                const day = String(date.getDate()).padStart(2, "0")

                setForm((prev) => ({
                  ...prev,
                  [field]: `${year}-${month}-${day}`,
                }))
              } else {
                setForm((prev) => ({ ...prev, [field]: null }))
              }
              setCalendarOpen((prev) => ({ ...prev, [field]: false }))
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )

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

          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            {form.status === "Pago" && renderDatePicker("Data do pagamento", "payment_date")}
            {hasDueDate && renderDatePicker("Data limite", "due_date")}
          </div>

          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="hasDueDate">Possui data limite?</Label>
            <Switch
              id="hasDueDate"
              checked={hasDueDate}
              onCheckedChange={(checked) => {
                setHasDueDate(checked)
                if (!checked) {
                  setForm((prev) => ({ ...prev, due_date: null }))
                }
              }}
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

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={creating || updating}
              className="flex-1"
            >
              {creating || updating
                ? "Salvando..."
                : finance
                ? "Salvar Alterações"
                : "Criar"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
