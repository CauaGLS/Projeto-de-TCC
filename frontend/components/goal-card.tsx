"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useEffect, useMemo, useState } from "react"

interface GoalCardProps {
  goal: {
    id: number
    title: string
    target_value: number
    current_value: number
    deadline_date?: string | null
    deadline?: string | null
  }
  onView: (id: number) => void
}

export function GoalCard({ goal, onView }: GoalCardProps) {
  const [status, setStatus] = useState<"ok" | "near" | "expired" | "reached">("ok")

  // progresso
  const progress = Math.min((goal.current_value / goal.target_value) * 100, 100)

  // cálculo de prazo e status
  useEffect(() => {
    const rawDeadline =
      goal.deadline_date ?? goal.deadline ?? null

    if (!rawDeadline) {
      setStatus(goal.current_value >= goal.target_value ? "reached" : "ok")
      return
    }

    let deadlineDate: Date
    try {
      if (/^\d{4}-\d{2}-\d{2}$/.test(String(rawDeadline))) {
        deadlineDate = new Date(`${String(rawDeadline)}T23:59:59`)
      } else {
        deadlineDate = new Date(String(rawDeadline))
      }
    } catch {
      setStatus("ok")
      return
    }

    const now = new Date()
    const msPerDay = 1000 * 60 * 60 * 24
    const diff = deadlineDate.getTime() - now.getTime()
    const daysLeft = Math.ceil(diff / msPerDay)

    if (goal.current_value >= goal.target_value) {
      setStatus("reached")
    } else if (daysLeft <= 0) {
      setStatus("expired")
    } else if (daysLeft <= 3) {
      setStatus("near")
    } else {
      setStatus("ok")
    }
  }, [goal])

  // badge visual
  const statusBadge = useMemo(() => {
    switch (status) {
      case "reached":
        return (
          <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
            🎉 Meta atingida
          </span>
        )
      case "near":
        return (
          <span className="text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">
            ⚠️ Prazo próximo
          </span>
        )
      case "expired":
        return (
          <span className="text-xs font-medium text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
            ⏰ Prazo vencido
          </span>
        )
      default:
        return null
    }
  }, [status])

  return (
    <Card
      className="shadow-md hover:shadow-lg transition-all cursor-pointer"
      onClick={() => onView(goal.id)}
    >
      <CardHeader>
        <div className="flex flex-col gap-1">
          <CardTitle className="text-lg font-semibold">{goal.title}</CardTitle>
          {statusBadge}
        </div>

        {goal.deadline_date && (
          <p className="text-xs text-muted-foreground mt-1">
            Data limite:{" "}
            {new Date(goal.deadline_date).toLocaleDateString("pt-BR")}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        <Progress value={progress} />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>R$ {goal.current_value.toFixed(2)}</span>
          <span>R$ {goal.target_value.toFixed(2)}</span>
        </div>
      </CardContent>
    </Card>
  )
}
