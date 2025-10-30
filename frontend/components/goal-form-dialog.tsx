"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
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
  const { createGoal, updateGoal } = useGoals(true);
  const isEditing = !!initialData?.id;

  const [title, setTitle] = useState("");
  const [value, setValue] = useState<number>(0);
  const [displayValue, setDisplayValue] = useState("0,00");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [deadlineObj, setDeadlineObj] = useState<{ year: number; month: number; day: number } | null>(null);

  useEffect(() => {
    if (open) {
      if (initialData) {
        setTitle(initialData.title ?? "");
        setValue(initialData.target_value ?? 0);
        setDisplayValue(formatCurrency(initialData.target_value ?? 0));

        if (initialData.deadline) {
          const [year, month, day] = initialData.deadline.split("-").map(Number);
          setDeadlineObj({ year, month, day });
        } else {
          setDeadlineObj(null);
        }
      } else {
        setTitle("");
        setValue(0);
        setDisplayValue("0,00");
        setDeadlineObj(null);
      }
    }
  }, [open, initialData]);

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
    let rawValue = e.target.value.replace(/[^\d,.]/g, "");
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
    setValue(parseCurrency(rawValue || "0"));
  }

  function handleCurrencyBlur() {
    setDisplayValue(formatCurrency(value));
  }

  function handleCurrencyFocus() {
    if (displayValue === "0,00" || displayValue === "0") setDisplayValue("");
  }

  async function handleSubmit() {
    if (!title || value <= 0) {
      toast.error("Preencha o título e o valor da meta corretamente.");
      return;
    }

    let localDeadline: string | undefined;
    if (deadlineObj) {
      const { year, month, day } = deadlineObj;
      localDeadline = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }

    const payload = {
      title,
      target_value: value,
      ...(localDeadline && { deadline: localDeadline }),
    };

    try {
      if (isEditing) {
        await updateGoal.mutateAsync({ id: initialData!.id!, data: payload });
        toast.success("Meta atualizada com sucesso!");
      } else {
        await createGoal.mutateAsync(payload);
        toast.success("Meta criada com sucesso!");
      }

      if (onSuccess) onSuccess();
      onClose();
      setTitle("");
      setValue(0);
      setDisplayValue("0,00");
      setDeadlineObj(null);
    } catch {
      toast.error("Erro ao salvar a meta.");
    }
  }

  const deadlineDisplay = deadlineObj
    ? `${String(deadlineObj.day).padStart(2, "0")}/${String(deadlineObj.month).padStart(2, "0")}/${deadlineObj.year}`
    : "Selecionar data";

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
                {deadlineDisplay}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="center" className="p-0 w-auto mx-auto">
              <Calendar
                mode="single"
                selected={
                  deadlineObj
                    ? new Date(deadlineObj.year, deadlineObj.month - 1, deadlineObj.day)
                    : undefined
                }
                onSelect={(d) => {
                  if (!d) return;
                  setDeadlineObj({ year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() });
                  setCalendarOpen(false);
                  toast.info("Data limite definida para " + d.toLocaleDateString("pt-BR"));
                }}
              />
            </PopoverContent>
          </Popover>
        </div>

        <DialogFooter className="pt-4">
          <Button onClick={handleSubmit}>
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
