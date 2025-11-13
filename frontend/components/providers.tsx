"use client"

import { useEffect, useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "./ui/sonner"
import { useGoalNotifications } from "@/hooks/useGoalNotifications"
import { useFinanceNotifications } from "@/hooks/useFinanceNotifications"
import { useSession } from "@/lib/auth-client"
import { FinanceCreateProvider } from "@/hooks/useFinanceCreate"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <FinanceCreateProvider> {/* 👈 envolve toda a aplicação */}
        <GoalNotificationWrapper queryClient={queryClient} />
        <FinanceNotificationWrapper queryClient={queryClient} />
        {children}
        <Toaster position="top-right" />
      </FinanceCreateProvider>
    </QueryClientProvider>
  )
}

export function GoalNotificationWrapper({ queryClient }: { queryClient: QueryClient }) {
  const { data } = useSession()
  const userExists = !!data?.user

  useEffect(() => {
    if (!userExists) queryClient.clear()
  }, [userExists, queryClient])

  useGoalNotifications(userExists)
  return null
}

export function FinanceNotificationWrapper({ queryClient }: { queryClient: QueryClient }) {
  const { data } = useSession()
  const userExists = !!data?.user

  useEffect(() => {
    if (!userExists) queryClient.clear()
  }, [userExists, queryClient])

  useFinanceNotifications(userExists)
  return null
}
