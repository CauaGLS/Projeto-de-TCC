"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Finances } from "@/services"
import { Button } from "@/components/ui/button"
import { FileDown, Plus } from "lucide-react"
import { GoalCard } from "@/components/goal-card"
import GoalDetailsDialog from "@/components/goal-details-dialog"
import { GoalFormDialog } from "@/components/goal-form-dialog"

export default function GoalsPage() {
  const queryClient = useQueryClient()

  const [createOpen, setCreateOpen] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<any | null>(null)

  // --- Buscar lista de metas ---
  const { data: goals, isLoading } = useQuery({
    queryKey: ["goals"],
    queryFn: () => Finances.listGoals(),
  })

  // --- Ver detalhes ---
  async function handleViewGoal(id: number) {
    const goal = await Finances.getGoal({ goalId: id })
    setSelectedGoal(goal)
  }

  // --- Fechar detalhes ---
  function handleCloseDetails() {
    setSelectedGoal(null)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Metas</h1>
        </div>

        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Criar Meta
        </Button>
      </div>

      {/* Lista de metas */}
      {isLoading ? (
        <p>Carregando metas...</p>
      ) : goals && goals.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal: any) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onView={handleViewGoal}
            />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-center">
          Nenhuma meta cadastrada ainda.
        </p>
      )}

      {/* Modal de criação */}
      <GoalFormDialog open={createOpen} onClose={() => setCreateOpen(false)} />

      {/* Modal de detalhes */}
      {selectedGoal && (
        <GoalDetailsDialog goal={selectedGoal} onClose={handleCloseDetails} />
      )}
    </div>
  )
}
