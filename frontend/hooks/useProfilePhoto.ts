"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Finances } from "@/services";

export function useProfilePhoto() {
  const queryClient = useQueryClient();

  const uploadPhoto = useMutation({
    mutationFn: async (file: File) => {
      const response = await Finances.uploadProfilePhoto({
        formData: { file },
      });
      // 🔹 Retorna diretamente o photo_url do backend
      return (response as any)?.photo_url;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session"] });
    },
  });

  return { uploadPhoto };
}
