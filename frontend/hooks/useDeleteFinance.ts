// hooks/useDeleteFinance.ts
"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Finances } from "@/services"
import { toast } from "sonner"

export function useDeleteFinance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) =>
      Finances.deleteFinance({ financeId: id }),
    onSuccess: () => {
      toast.success("Registro deletado.")
      queryClient.invalidateQueries({ queryKey: ["finances"] })
    },
  })
}
