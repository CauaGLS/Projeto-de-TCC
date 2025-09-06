// hooks/useUpdateFinance.ts
"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Finances } from "@/services"
import type { CreateFinanceData } from "@/services/types.gen"

export function useUpdateFinance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateFinanceData["requestBody"] }) =>
      Finances.updateFinance({ financeId: id, requestBody: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finances"] })
    },
  })
}
