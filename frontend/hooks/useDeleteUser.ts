"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Finances } from "@/services";

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await Finances.deleteUserAccount();
    },
    onSuccess: () => {
      toast.success("Conta excluída com sucesso.");

      // Cancela todas as queries ativas
      queryClient.cancelQueries();
      queryClient.clear(); // limpa cache
      localStorage.clear();
      sessionStorage.clear();

      // Redireciona
      setTimeout(() => {
        window.location.href = "/sign-in";
      }, 500);
    },

    onError: (error: any) => {
      console.error(error);
      toast.error("Erro ao excluir conta. Tente novamente.");
    },
  });
}
