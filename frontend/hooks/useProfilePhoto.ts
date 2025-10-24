"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Finances } from "@/services";

export function useProfilePhoto() {
  const queryClient = useQueryClient();

  const uploadPhoto = useMutation({
    mutationFn: (file: File) => {
      return Finances.uploadProfilePhoto({
        formData: { file },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session"] });
    },
  });

  return { uploadPhoto };
}
