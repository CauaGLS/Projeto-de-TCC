"use client"

import { useEffect, useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "./ui/sonner"
import { useGoalNotifications } from "@/hooks/useGoalNotifications"
import { useSession } from "@/lib/auth-client"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <GoalNotificationWrapper queryClient={queryClient} />
      {children}
      <Toaster position="top-right" />
    </QueryClientProvider>
  )
}

export function GoalNotificationWrapper({ queryClient }: { queryClient: QueryClient }) {
  const { data } = useSession()
  const userExists = !!data?.user

  useEffect(() => {
    if (!userExists) {
      queryClient.clear()
    }
  }, [userExists, queryClient])

  useGoalNotifications(userExists)
  return null
}
