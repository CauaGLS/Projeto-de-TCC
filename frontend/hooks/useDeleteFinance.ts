// hooks/useDeleteFinance.ts
"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Finances } from "@/services"

export function useDeleteFinance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) =>
      Finances.deleteFinance({ financeId: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finances"] })
    },
  })
}
