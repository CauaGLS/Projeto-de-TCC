"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Finances } from "@/services";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { X, Trash2, Pencil } from "lucide-react";
import { GoalFormDialog } from "./goal-form-dialog";
import { useGoals } from "@/hooks/useGoals";

interface GoalDetailsProps {
  goal: any;
  onClose: () => void;
}

export default function GoalDetails({ goal, onClose }: GoalDetailsProps) {
  const queryClient = useQueryClient();
  const { addGoalRecord } = useGoals(true);
  const [amount, setAmount] = useState("0,00");
  const [editOpen, setEditOpen] = useState(false);
  const [currentGoal, setCurrentGoal] = useState(goal);
  const notifiedRef = useRef<{
    deadlineWarning?: boolean;
    deadlineReached?: boolean;
  }>({});

  // Mutação para exclusão de meta
  const deleteGoalMutation = useMutation({
    mutationFn: () => Finances.deleteGoal({ goalId: currentGoal.id }),
    onSuccess: () => {
      toast.success(`Meta "${currentGoal.title}" excluída com sucesso.`);
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      onClose();
    },
    onError: () => toast.error("Erro ao excluir a meta."),
  });

  // --- Funções auxiliares (moeda) ---
  function formatCurrency(value: number): string {
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  function parseCurrency(value: string): number {
    const clean = value.replace(/\./g, "").replace(",", ".");
    return parseFloat(clean) || 0;
  }

  function handleCurrencyChange(e: React.ChangeEvent<HTMLInputElement>) {
    let raw = e.target.value.replace(/[^\d,.]/g, "");
    const hasDecimal = raw.includes(",") || raw.includes(".");
    if (hasDecimal) {
      raw = raw.replace(".", ",");
      const firstCommaIndex = raw.indexOf(",");
      if (firstCommaIndex !== -1) {
        raw =
          raw.substring(0, firstCommaIndex + 1) +
          raw.substring(firstCommaIndex + 1).replace(/,/g, "");
      }
      const parts = raw.split(",");
      if (parts[1] && parts[1].length > 2) {
        raw = `${parts[0]},${parts[1].slice(0, 2)}`;
      }
    }
    if (raw.startsWith(",")) raw = "0" + raw;
    setAmount(raw);
  }

  function handleCurrencyBlur() {
    const numeric = parseCurrency(amount);
    setAmount(formatCurrency(numeric));
  }

  function handleCurrencyFocus() {
    if (amount === "0,00" || amount === "0") setAmount("");
  }

  async function refreshGoal() {
    const updated = await Finances.getGoal({ goalId: currentGoal.id });
    setCurrentGoal(updated);
    queryClient.invalidateQueries({ queryKey: ["goals"] });
  }

  // --- Adicionar valor ---
  async function handleAdd() {
    const numericValue = parseCurrency(amount);
    if (numericValue <= 0) {
      toast.warning("Informe um valor válido para adicionar.");
      return;
    }

    try {
      await addGoalRecord.mutateAsync({
        goalId: currentGoal.id,
        data: {
          title: `Adição em ${currentGoal.title}`,
          value: numericValue,
          type: "Adicionar",
        },
      });
      toast.success("Valor adicionado à meta!");
      setAmount("0,00");
      await refreshGoal();
    } catch {
      toast.error("Erro ao adicionar valor à meta.");
    }
  }

  // --- Subtrair valor ---
  async function handleSubtract() {
    const numericValue = parseCurrency(amount);
    if (numericValue <= 0) {
      toast.warning("Informe um valor válido para subtrair.");
      return;
    }

    try {
      await addGoalRecord.mutateAsync({
        goalId: currentGoal.id,
        data: {
          title: `Retirada em ${currentGoal.title}`,
          value: numericValue,
          type: "Retirar",
        },
      });
      toast.success("Valor subtraído da meta.");
      setAmount("0,00");
      await refreshGoal();
    } catch {
      toast.error("Erro ao subtrair valor da meta.");
    }
  }

  // --- Cálculo do progresso (sempre usar currentGoal atualizado) ---
  const progressPercent = Math.min(
    (Number(currentGoal?.current_value || 0) /
      Number(currentGoal?.target_value || 1)) *
      100,
    100
  );

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-lg relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
          >
            <X size={20} />
          </button>

          {/* Cabeçalho */}
          <div className="mb-4">
            <h2 className="text-2xl font-bold mb-1">{currentGoal.title}</h2>
            <p className="text-lg text-gray-800">
              R$ {Number(currentGoal.target_value).toFixed(2)}
            </p>
          </div>

          {/* Progresso */}
          <div className="mb-4">
            <Progress value={progressPercent} className="h-4 bg-gray-200" />
            <div className="flex justify-between text-sm mt-1">
              <span>R$ {Number(currentGoal.current_value).toFixed(2)}</span>
              <span>R$ {Number(currentGoal.target_value).toFixed(2)}</span>
            </div>

            {currentGoal.deadline && (
              <p className="text-xs text-gray-500 mt-1">
                Data definida:{" "}
                {(() => {
                  // tenta suportar formatos YYYY-MM-DD ou ISO
                  const raw = currentGoal.deadline ?? currentGoal.deadline_date;
                  if (!raw) return "";
                  const d = raw.split ? raw.split("-").map(Number) : null;
                  if (d && d.length === 3) {
                    const [year, month, day] = d;
                    return `${String(day).padStart(2, "0")}/${String(
                      month
                    ).padStart(2, "0")}/${year}`;
                  }
                  try {
                    const parsed = new Date(raw);
                    return parsed.toLocaleDateString("pt-BR");
                  } catch {
                    return String(raw);
                  }
                })()}
              </p>
            )}
          </div>

          {/* Campo de valor */}
          <div className="mb-4">
            <label className="text-sm font-medium mb-1 block">Valor (R$)</label>
            <Input
              value={amount}
              onChange={handleCurrencyChange}
              onBlur={handleCurrencyBlur}
              onFocus={handleCurrencyFocus}
              placeholder="0,00"
            />
          </div>

          {/* Botões de ação */}
          <div className="flex gap-2 mb-6">
            <Button
              className="flex-1 bg-black text-white hover:bg-gray-800"
              onClick={handleAdd}
              disabled={addGoalRecord.isPending}
            >
              Somar
            </Button>
            <Button
              className="flex-1 bg-red-600 text-white hover:bg-red-700"
              onClick={handleSubtract}
              disabled={addGoalRecord.isPending}
            >
              Subtrair
            </Button>
          </div>

          {/* Histórico */}
          <div className="mb-6">
            <h3 className="font-bold mb-2">Histórico</h3>
            <ul className="max-h-48 overflow-y-auto space-y-1">
              {currentGoal.records?.length ? (
                currentGoal.records.map((r: any) => (
                  <li
                    key={r.id}
                    className="flex justify-between text-sm font-medium"
                  >
                    <span
                      className={
                        r.type === "Adicionar"
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {r.type === "Adicionar" ? "+ " : "- "}R${" "}
                      {Number(r.value).toFixed(2)}
                    </span>
                    <span className="text-gray-600">
                      {new Date(r.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </li>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Sem registros.</p>
              )}
            </ul>
          </div>

          {/* Botões Editar / Excluir */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-2"
            >
              <Pencil size={16} /> Editar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteGoalMutation.mutate()}
              disabled={deleteGoalMutation.isPending}
              className="flex items-center gap-2"
            >
              <Trash2 size={16} />
              {deleteGoalMutation.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </div>
        </div>
      </div>

      {/* Modal de edição */}
      {editOpen && (
        <GoalFormDialog
          open={editOpen}
          onClose={() => setEditOpen(false)}
          initialData={currentGoal}
          onSuccess={async () => {
            const updated = await Finances.getGoal({ goalId: currentGoal.id });
            setCurrentGoal(updated);
            setEditOpen(false);
            // reset notifications so user can get warnings again if date approaches
            notifiedRef.current = {};
          }}
        />
      )}
    </>
  );
}
