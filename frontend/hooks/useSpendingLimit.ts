"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Finances } from "@/services"
import { toast } from "sonner"
import type { CreateOrUpdateSpendingLimitSchema } from "@/services/types.gen"

export function useSpendingLimit(userExists: boolean) {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["spending-limit"],
    queryFn: () => Finances.getSpendingLimit(),
    enabled: userExists,
  })

  const mutationSet = useMutation({
    mutationFn: (payload: CreateOrUpdateSpendingLimitSchema) =>
      Finances.setSpendingLimit({ requestBody: payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spending-limit"] })
      toast.success("Limite de gastos definido!")
    },
    onError: () => {
      toast.error("Erro ao definir o limite de gastos.")
    },
  })

  const mutationDelete = useMutation({
    mutationFn: () => Finances.deleteSpendingLimit(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spending-limit"] })
      toast.success("Limite de gastos removido.")
    },
    onError: () => {
      toast.error("Erro ao remover o limite de gastos.")
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
