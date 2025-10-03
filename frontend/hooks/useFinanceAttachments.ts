"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Finances } from "@/services"
import type { FinanceAttachmentSchema, DetailFinanceSchema } from "@/services/types.gen"

export function useFinanceAttachments(financeId: number) {
  const queryClient = useQueryClient()

  // Agora o query está tipado como um array de anexos
  const { data, isLoading } = useQuery<FinanceAttachmentSchema[]>({
    queryKey: ["attachments", financeId],
    queryFn: async () => {
      const finance: DetailFinanceSchema = await Finances.getFinance({ financeId })
      return finance.attachments ?? []
    },
    enabled: !!financeId,
  })

  // Upload (mantém apenas 1 anexo por registro)
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (data && data.length > 0) {
        await Finances.deleteFinanceAttachment({ attachmentId: data[0].id })
      }

      return Finances.uploadFinanceAttachments({
        financeId,
        formData: { files: [file] },
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["attachments", financeId] })
    },
  })

  // Deletar anexo
  const deleteMutation = useMutation({
    mutationFn: (attachmentId: number) =>
      Finances.deleteFinanceAttachment({ attachmentId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["attachments", financeId] })
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
