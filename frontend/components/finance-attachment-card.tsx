"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Trash2, Paperclip, Download } from "lucide-react";
import { useFinanceAttachments } from "@/hooks/useFinanceAttachments";
import { toast } from "sonner";

interface FinanceAttachmentCardProps {
  financeId: number;
  open: boolean;
  onClose: () => void;
}

export function FinanceAttachmentCard({
  financeId,
  open,
  onClose,
}: FinanceAttachmentCardProps) {
  const { attachments, uploadAttachment, isUploading, deleteAttachment } =
    useFinanceAttachments(financeId);
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  // reset local state when dialog opens/closes or when attachments change
  useEffect(() => {
    if (!open) {
      setFile(null);
    }
  }, [open]);

  useEffect(() => {
    // if an attachment was uploaded elsewhere, clear local selected file
    if (attachments.length > 0) {
      setFile(null);
    }
  }, [attachments]);

  function handleSelectClick() {
    inputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] ?? null);
  }

  async function handleConfirm() {
    if (!file) {
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Arquivo muito grande! Máximo 10MB.");
      return;
    }

    uploadAttachment(file, {
      onSuccess: () => {
        toast.success("Arquivo anexado.");
        onClose();
      },
      onError: () => {
        toast.error("Erro ao anexar arquivo.");
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Anexar Arquivo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Se já existe anexo */}
          {attachments.length > 0 ? (
            <div className="flex items-center justify-between rounded-md border p-2">
              <div className="flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                <span className="truncate">
                  {attachments[0].name ?? "Arquivo anexado"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => window.open(attachments[0].file_url, "_blank")}
                  title="Baixar"
                >
                  <Download className="h-4 w-4" />
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => {
                    deleteAttachment(attachments[0].id, {
                      onSuccess: () =>
                        toast.success("Anexo removido."),
                      onError: () => toast.error("Erro ao remover o anexo."),
                    });
                  }}
                  title="Remover anexo"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            // Se NÃO existe anexo, mostra seletor programático
            <div className="flex items-center gap-2">
              <input
                id={`file-upload-${financeId}`}
                ref={inputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />

              <Button
                type="button"
                variant="outline"
                onClick={handleSelectClick}
                className="flex-1 flex items-center gap-2 truncate"
              >
                <Paperclip className="h-4 w-4" />
                {file ? file.name : "Selecionar arquivo"}
              </Button>

              {file && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => setFile(null)}
                  title="Remover seleção"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
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
  );
}
