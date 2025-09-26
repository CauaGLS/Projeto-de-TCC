"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export type Filters = {
  title?: string | null
  type?: "Receita" | "Despesa" | null
  status?: "Pendente" | "Pago" | "Atrasada" | null
  category?: string | null
  due_date?: string | null
  payment_date?: string | null
}

export function SearchBar({ onApply }: { onApply: (filters: Filters) => void }) {
  const [localFilters, setLocalFilters] = useState<Filters>({})
  const [calendarOpen, setCalendarOpen] = useState<{
    payment_date: boolean
    due_date: boolean
  }>({ payment_date: false, due_date: false })

  function handleApply() {
    onApply(localFilters)
  }

  function handleClear() {
    setLocalFilters({})
    onApply({})
  }

  function parseLocalDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split("-").map(Number)
    return new Date(year, month - 1, day)
  }

  const renderDatePicker = (label: string, field: "payment_date" | "due_date") => (
    <Popover
      open={calendarOpen[field]}
      onOpenChange={(open) =>
        setCalendarOpen((prev) => ({ ...prev, [field]: open }))
      }
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`w-[180px] justify-start text-left font-normal ${
            !localFilters[field] && "text-muted-foreground"
          }`}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {localFilters[field]
            ? format(parseLocalDate(localFilters[field] as string), "dd/MM/yyyy", {
                locale: ptBR,
              })
            : label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={
            localFilters[field]
              ? parseLocalDate(localFilters[field] as string)
              : undefined
          }
          onSelect={(date) => {
            if (date) {
              const year = date.getFullYear()
              const month = String(date.getMonth() + 1).padStart(2, "0")
              const day = String(date.getDate()).padStart(2, "0")
              setLocalFilters((prev) => ({
                ...prev,
                [field]: `${year}-${month}-${day}`,
              }))
            } else {
              setLocalFilters((prev) => ({ ...prev, [field]: null }))
            }
            setCalendarOpen((prev) => ({ ...prev, [field]: false }))
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )

  return (
    <div className="flex flex-col gap-3 px-4 lg:px-6">
      {/* Linha 1: título + categoria */}
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Pesquisar por título..."
          value={localFilters.title ?? ""}
          onChange={(e) =>
            setLocalFilters((prev) => ({
              ...prev,
              title: e.target.value || null,
            }))
          }
          className="flex-1 min-w-[250px]"
        />

        <Input
          placeholder="Categoria..."
          value={localFilters.category ?? ""}
          onChange={(e) =>
            setLocalFilters((prev) => ({
              ...prev,
              category: e.target.value || null,
            }))
          }
          className="w-[200px]"
        />
      </div>

      {/* Linha 2: filtros + botões */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Tipo */}
        <Select
          value={localFilters.type ?? "all"}
          onValueChange={(v) =>
            setLocalFilters((prev) => ({
              ...prev,
              type: v === "all" ? null : (v as "Receita" | "Despesa"),
            }))
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="Receita">Receita</SelectItem>
            <SelectItem value="Despesa">Despesa</SelectItem>
          </SelectContent>
        </Select>

        {/* Status */}
        <Select
          value={localFilters.status ?? "all"}
          onValueChange={(v) =>
            setLocalFilters((prev) => ({
              ...prev,
              status:
                v === "all" ? null : (v as "Pendente" | "Pago" | "Atrasada"),
            }))
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="Pendente">Pendente</SelectItem>
            <SelectItem value="Pago">Pago</SelectItem>
            <SelectItem value="Atrasada">Atrasada</SelectItem>
          </SelectContent>
        </Select>

        {/* Datas com calendário */}
        {renderDatePicker("Data de Pagamento", "payment_date")}
        {renderDatePicker("Data de Vencimento", "due_date")}

        {/* Botões logo após os filtros */}
        <Button variant="outline" onClick={handleClear}>
          Limpar
        </Button>
        <Button onClick={handleApply}>Pesquisar</Button>
      </div>
    </div>
  )
}
