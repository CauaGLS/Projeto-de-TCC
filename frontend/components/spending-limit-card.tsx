"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSpendingLimit } from "@/hooks/useSpendingLimit"
import { Trash2 } from "lucide-react"

export function SpendingLimitCard({ onClose }: { onClose: () => void }) {
  const { spendingLimit, setSpendingLimit, isSaving, deleteSpendingLimit, isDeleting } = useSpendingLimit(true)

  const [displayValue, setDisplayValue] = useState("")
  const [numericValue, setNumericValue] = useState<number | null>(null)

  useEffect(() => {
    if (spendingLimit) {
      const val = Number(spendingLimit.value)
      setNumericValue(val)
      setDisplayValue(formatCurrency(val))
    } else {
      setNumericValue(null)
      setDisplayValue("")
    }
  }, [spendingLimit])

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
  }

  function parseCurrency(value: string): number {
    const clean = value.replace(/\./g, "").replace(",", ".")
    return parseFloat(clean) || 0
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    let raw = e.target.value.replace(/[^\d,.]/g, "")
    raw = raw.replace(".", ",")
    const num = parseCurrency(raw)
    setDisplayValue(raw)
    setNumericValue(num)
  }

  function handleBlur() {
    if (numericValue !== null) {
      setDisplayValue(formatCurrency(numericValue))
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (numericValue !== null) {
      setSpendingLimit({ value: numericValue })
    }
    onClose()
  }

  function handleDelete() {
    deleteSpendingLimit()
    setDisplayValue("")
    setNumericValue(null)
    onClose()
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Definir Limite de Gastos</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="limit">Valor do Limite (R$)</Label>
            <div className="relative flex items-center">
              <Input
                id="limit"
                name="limit"
                value={displayValue}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="0,00"
                className="pr-10"
              />
              {spendingLimit && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="absolute right-1 h-8 w-8 text-red-500 hover:bg-red-100"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isSaving} className="flex-1">
              {isSaving ? "Salvando..." : "Salvar"}
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
