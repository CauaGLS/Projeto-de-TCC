"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Finances } from "@/services"

export function useFinanceAttachments(financeId: number) {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["attachments", financeId],
    queryFn: async () => {
      const finance = await Finances.getFinance({ financeId })
      return finance.attachments ?? []
    },
  })

  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = { files: [file] }
      return Finances.uploadFinanceAttachments({
        financeId,
        formData,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attachments", financeId] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (attachmentId: number) =>
      Finances.deleteFinanceAttachment({ attachmentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attachments", financeId] })
    },
  })

  return {
    attachments: data ?? [],
    isLoading,
    uploadAttachment: uploadMutation.mutate,
    isUploading: uploadMutation.isPending,
    deleteAttachment: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  }
}
