"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useGoals } from "@/hooks/useGoals";

interface GoalFormDialogProps {
  open: boolean;
  onClose: () => void;
  initialData?: {
    id?: number;
    title?: string;
    target_value?: number;
    deadline?: string | null;
  };
  onSuccess?: () => void;
}

export function GoalFormDialog({
  open,
  onClose,
  initialData,
  onSuccess,
}: GoalFormDialogProps) {
  const { createGoal, updateGoal } = useGoals();
  const isEditing = !!initialData?.id;

  const [title, setTitle] = useState("");
  const [value, setValue] = useState<number>(0);
  const [displayValue, setDisplayValue] = useState("0,00");
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Resetar formulário ao abrir/fechar
  useEffect(() => {
    if (open) {
      if (initialData) {
        setTitle(initialData.title ?? "");
        setValue(initialData.target_value ?? 0);
        setDisplayValue(formatCurrency(initialData.target_value ?? 0));
        setDeadline(
          initialData.deadline ? new Date(initialData.deadline) : null
        );
      } else {
        setTitle("");
        setValue(0);
        setDisplayValue("0,00");
        setDeadline(null);
      }
    }
  }, [open, initialData]);

  // === formatação moeda ===
  function formatCurrency(value: number): string {
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  function parseCurrency(value: string): number {
    const cleanValue = value.replace(/\./g, "").replace(",", ".");
    return parseFloat(cleanValue) || 0;
  }

  function handleCurrencyChange(e: React.ChangeEvent<HTMLInputElement>) {
    let rawValue = e.target.value;
    rawValue = rawValue.replace(/[^\d,.]/g, "");
    const hasDecimal = rawValue.includes(",") || rawValue.includes(".");
    if (hasDecimal) {
      rawValue = rawValue.replace(".", ",");
      const firstCommaIndex = rawValue.indexOf(",");
      if (firstCommaIndex !== -1) {
        rawValue =
          rawValue.substring(0, firstCommaIndex + 1) +
          rawValue.substring(firstCommaIndex + 1).replace(/,/g, "");
      }
      const parts = rawValue.split(",");
      if (parts[1] && parts[1].length > 2) {
        rawValue = `${parts[0]},${parts[1].slice(0, 2)}`;
      }
    }
    if (rawValue.startsWith(",")) rawValue = "0" + rawValue;
    setDisplayValue(rawValue);
    const numericValue = parseCurrency(rawValue || "0");
    setValue(numericValue);
  }

  function handleCurrencyBlur() {
    const formatted = formatCurrency(value);
    setDisplayValue(formatted);
  }

  function handleCurrencyFocus() {
    if (displayValue === "0,00" || displayValue === "0") setDisplayValue("");
  }

  function handleSubmit() {
    if (!title || value <= 0) return;

    const payload = {
      title,
      target_value: value,
      ...(deadline && { deadline: format(deadline, "yyyy-MM-dd") }),
    };

    const mutation = isEditing
      ? updateGoal.mutateAsync({ id: initialData!.id!, data: payload })
      : createGoal.mutateAsync(payload);

    mutation.then(() => {
      if (onSuccess) onSuccess();
      onClose();
      // Limpar campos após sucesso
      setTitle("");
      setValue(0);
      setDisplayValue("0,00");
      setDeadline(null);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Meta" : "Nova Meta"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Label>Título da meta</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Viagem, computador novo..."
          />

          <Label>Valor alvo (R$)</Label>
          <Input
            value={displayValue}
            onChange={handleCurrencyChange}
            onBlur={handleCurrencyBlur}
            onFocus={handleCurrencyFocus}
            placeholder="0,00"
          />

          <Label>Data limite (opcional)</Label>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {deadline
                  ? format(deadline, "dd/MM/yyyy", { locale: ptBR })
                  : "Selecionar data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="center" className="p-0 w-auto mx-auto">
              <Calendar
                mode="single"
                selected={deadline ?? undefined}
                onSelect={(d) => setDeadline(d ?? null)}
              />
            </PopoverContent>
          </Popover>
        </div>

        <DialogFooter className="pt-4">
          <Button
            onClick={handleSubmit}
            disabled={createGoal.isPending || updateGoal.isPending}
          >
            {isEditing ? "Salvar Alterações" : "Criar Meta"}
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
