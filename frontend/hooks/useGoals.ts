"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Finances } from "@/services";

export function useGoals() {
  const queryClient = useQueryClient();

  const listGoals = useQuery({
    queryKey: ["goals"],
    queryFn: () => Finances.listGoals(),
  });

  const createGoal = useMutation({
    mutationFn: (data: { title: string; target_value: number; deadline?: string }) =>
      Finances.createGoal({ requestBody: data }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals"] }),
  });

  const updateGoal = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: { title: string; target_value: number; deadline?: string };
    }) => Finances.updateGoal({ goalId: id, requestBody: data }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals"] }),
  });

  const deleteGoal = useMutation({
    mutationFn: (goalId: number) => Finances.deleteGoal({ goalId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals"] }),
  });

  const addGoalRecord = useMutation({
    mutationFn: ({
      goalId,
      data,
    }: {
      goalId: number;
      data: { title: string; value: number; type: "Adicionar" | "Retirar" };
    }) =>
      Finances.addGoalRecord({
        goalId,
        requestBody: data,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals"] }),
  });

  return {
    listGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    addGoalRecord,
  };
}
