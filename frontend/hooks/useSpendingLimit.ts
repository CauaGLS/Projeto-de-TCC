"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Finances } from "@/services"
import type { CreateOrUpdateSpendingLimitSchema } from "@/services/types.gen"

export function useSpendingLimit() {
  const queryClient = useQueryClient()

  // Buscar limite
  const { data, isLoading } = useQuery({
    queryKey: ["spending-limit"],
    queryFn: () => Finances.getSpendingLimit(),
  })

  // Criar/atualizar limite
  const mutationSet = useMutation({
    mutationFn: (payload: CreateOrUpdateSpendingLimitSchema) =>
      Finances.setSpendingLimit({ requestBody: payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spending-limit"] })
    },
  })

  // Deletar limite
  const mutationDelete = useMutation({
    mutationFn: () => Finances.deleteSpendingLimit(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spending-limit"] })
    },
  })

  return {
    spendingLimit: data,
    isLoading,
    setSpendingLimit: mutationSet.mutate,
    isSaving: mutationSet.isPending,
    deleteSpendingLimit: mutationDelete.mutate,
    isDeleting: mutationDelete.isPending,
  }
}
