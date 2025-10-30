"use client"

import { useEffect, useRef } from "react"
import { toast } from "sonner"
import { useGoals } from "@/hooks/useGoals"

export function useGoalNotifications(userExists: boolean) {
  const { listGoals } = useGoals(userExists)
  const notifiedGoals = useRef<Set<string>>(new Set()) // evita repetir notificações

  useEffect(() => {
    if (!userExists) return

    const goals = listGoals?.data
    if (!goals || !Array.isArray(goals)) return

    const now = new Date()
    now.setHours(0, 0, 0, 0)

    goals.forEach((goal) => {
      const goalId = goal.id.toString()
      const { title, current_value, target_value, deadline } = goal

      if (!deadline) return

      // padroniza formato yyyy-MM-dd
      const deadlineDate = new Date(`${deadline}T00:00:00`)
      deadlineDate.setHours(0, 0, 0, 0)

      const diffMs = deadlineDate.getTime() - now.getTime()
      const daysLeft = Math.floor(diffMs / (1000 * 60 * 60 * 24))

      // evita repetir notificações
      const notifyOnce = (
        key: string,
        message: string,
        variant: "success" | "error" | "warning" | "info" = "info"
      ) => {
        const uniqueKey = `${goalId}-${key}`
        if (!notifiedGoals.current.has(uniqueKey)) {
          notifiedGoals.current.add(uniqueKey)
          toast[variant](message)
        }
      }

      // 🔔 Regras de notificação
      if (current_value >= target_value) {
        notifyOnce("goal-achieved", `Meta "${title}" atingida com sucesso!`, "success")
      } else if (daysLeft === 0) {
        notifyOnce("deadline-today", `Hoje é o prazo final da meta "${title}"!`, "warning")
      } else if (daysLeft === 1) {
        notifyOnce("deadline-tomorrow", `A meta "${title}" termina amanhã.`, "warning")
      } else if (daysLeft > 1 && daysLeft <= 3) {
        notifyOnce("deadline-soon", `Restam ${daysLeft} dias para o fim da meta "${title}".`, "info")
      } else if (daysLeft < 0 && current_value < target_value) {
        notifyOnce("deadline-expired", `A meta "${title}" passou do prazo e não foi concluída.`, "error")
      }
    })
  }, [listGoals?.data, userExists])
}
