"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Trash2 } from "lucide-react"
import { useFinanceAttachments } from "@/hooks/useFinanceAttachments"

interface FinanceAttachmentCardProps {
  financeId: number
  open: boolean
  onClose: () => void
}

export function FinanceAttachmentCard({ financeId, open, onClose }: FinanceAttachmentCardProps) {
  const { uploadAttachment, isUploading } = useFinanceAttachments(financeId)
  const [file, setFile] = useState<File | null>(null)

  function handleConfirm() {
    if (file) {
      uploadAttachment(file, { onSuccess: () => onClose() })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Anexar Arquivo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {file && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => setFile(null)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <DialogFooter className="flex gap-2 pt-4">
            <Button
              onClick={handleConfirm}
              disabled={!file || isUploading}
              className="flex-1"
            >
              {isUploading ? "Anexando..." : "Anexar"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
