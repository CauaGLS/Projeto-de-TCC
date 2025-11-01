"use client"

import { useEffect, useRef } from "react"
import { toast } from "sonner"
import { useFinances } from "@/hooks/useFinances"

export function useFinanceNotifications(userExists: boolean) {
  const { data: finances } = useFinances(userExists)
  const notifiedFinances = useRef<Set<string>>(new Set()) // evita repetir notificações

  useEffect(() => {
    if (!userExists) return
    if (!finances || !Array.isArray(finances)) return

    const now = new Date()
    now.setHours(0, 0, 0, 0)

    finances.forEach((f) => {
      if (f.status === "Pago") return

      const financeId = f.id.toString()
      const { title, due_date } = f
      if (!due_date) return

      // padroniza formato yyyy-MM-dd
      const dueDate = new Date(`${due_date}T00:00:00`)
      dueDate.setHours(0, 0, 0, 0)

      const diffMs = dueDate.getTime() - now.getTime()
      const daysLeft = Math.floor(diffMs / (1000 * 60 * 60 * 24))

      // função que garante notificação única
      const notifyOnce = (
        key: string,
        message: string,
        variant: "success" | "error" | "warning" | "info" = "info"
      ) => {
        const uniqueKey = `${financeId}-${key}`
        if (!notifiedFinances.current.has(uniqueKey)) {
          notifiedFinances.current.add(uniqueKey)
          toast[variant](message)
        }
      }

      // 🔔 Regras de notificação personalizadas
      if (daysLeft === 0) {
        notifyOnce("due-today", `O pagamento de "${title}" é hoje!`, "warning")
      } else if (daysLeft === 1) {
        notifyOnce("due-tomorrow", `O pagamento de "${title}" é amanhã.`, "warning")
      } else if (daysLeft > 1 && daysLeft <= 3) {
        notifyOnce("due-soon", `Faltam ${daysLeft} dias para o pagamento de "${title}".`, "info")
      } else if (daysLeft < 0) {
        notifyOnce("due-expired", `O pagamento de "${title}" está atrasado à ${Math.abs(daysLeft)} dias!`, "error")
      }
    })
  }, [finances, userExists])
}
