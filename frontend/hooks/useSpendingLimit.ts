"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Finances } from "@/services"
import type { CreateOrUpdateSpendingLimitSchema } from "@/services/types.gen"

export function useSpendingLimit() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["spending-limit"],
    queryFn: () => Finances.getSpendingLimit(),
  })

  const mutation = useMutation({
    mutationFn: (payload: CreateOrUpdateSpendingLimitSchema) =>
      Finances.setSpendingLimit({ requestBody: payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spending-limit"] })
    },
  })

  return {
    spendingLimit: data,
    isLoading,
    setSpendingLimit: mutation.mutate,
    isSaving: mutation.isPending,
  }
}
