"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Finances } from "@/services"
import type { CreateFinanceData } from "@/services/types.gen"

export function useCreateFinance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateFinanceData["requestBody"]) =>
      Finances.createFinance({ requestBody: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finances"] })
    },
  })
}
