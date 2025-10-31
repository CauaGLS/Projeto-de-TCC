"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, FileDown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export function ExportFinanceCard({
  onClose,
  data,
}: {
  onClose: () => void;
  data: any[];
}) {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [formatType, setFormatType] = useState<"pdf" | "excel">("pdf");

  // filtra registros por intervalo
  function getFiltered() {
    return data.filter((f) => {
      const date = f.payment_date
        ? new Date(f.payment_date)
        : f.due_date
          ? new Date(f.due_date)
          : null;
      if (!date) return false;
      if (startDate && date < startDate) return false;
      if (endDate && date > endDate) return false;
      return true;
    });
  }

  function handleExport() {
    // valida campos
    if (!startDate || !endDate) {
      toast.error("Selecione a data de início e fim.");
      return;
    }

    if (startDate > endDate) {
      toast.error("A data de início não pode ser maior que a data fim.");
      return;
    }

    const filtered = getFiltered();
    if (!filtered.length) {
      toast.error("Nenhum registro encontrado para o período selecionado.");
      return;
    }

    try {
      if (formatType === "pdf") {
        generatePDF(filtered);
      } else {
        generateExcel(filtered);
      }
      toast.success("Exportação realizada com sucesso!");
    } catch (err) {
      toast.error("Erro ao exportar os registros.");
    }
  }

  // ---------------- PDF ----------------
  function generatePDF(records: any[]) {
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text("Histórico de Registros Financeiros", 14, 20);

    autoTable(doc, {
      startY: 30,
      head: [
        [
          "Título",
          "Tipo",
          "Status",
          "Categoria",
          "Valor (R$)",
          "Vencimento",
          "Pagamento",
        ],
      ],
      body: records.map((r) => [
        r.title,
        r.type,
        r.status,
        r.category || "-",
        Number(r.value).toFixed(2),
        r.due_date ? format(new Date(r.due_date), "dd/MM/yyyy") : "-",
        r.payment_date ? format(new Date(r.payment_date), "dd/MM/yyyy") : "-",
      ]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save("registros.pdf");
  }

  // ---------------- Excel ----------------
  function generateExcel(records: any[]) {
    const worksheet = XLSX.utils.json_to_sheet(
      records.map((r) => ({
        Título: r.title,
        Tipo: r.type,
        Status: r.status,
        Categoria: r.category || "-",
        "Valor (R$)": Number(r.value).toFixed(2),
        "Data Vencimento": r.due_date
          ? format(new Date(r.due_date), "dd/MM/yyyy")
          : "-",
        "Data Pagamento": r.payment_date
          ? format(new Date(r.payment_date), "dd/MM/yyyy")
          : "-",
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Registros");
    XLSX.writeFile(workbook, "registros.xlsx");
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Exportar Registros</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Período */}
          <div className="flex gap-4">
            <div className="flex flex-col gap-2 flex-1">
              <Label>Data início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate
                      ? format(startDate, "dd/MM/yyyy", { locale: ptBR })
                      : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <Calendar
                    mode="single"
                    required={false}
                    selected={startDate ?? undefined}
                    onSelect={setStartDate}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col gap-2 flex-1">
              <Label>Data fim</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate
                      ? format(endDate, "dd/MM/yyyy", { locale: ptBR })
                      : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <Calendar
                    mode="single"
                    required={false}
                    selected={endDate ?? undefined}
                    onSelect={setEndDate}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Seleção do formato */}
          <div className="flex gap-4">
            <Button
              variant={formatType === "pdf" ? "default" : "outline"}
              onClick={() => setFormatType("pdf")}
              className="flex-1"
            >
              PDF
            </Button>
            <Button
              variant={formatType === "excel" ? "default" : "outline"}
              onClick={() => setFormatType("excel")}
              className="flex-1"
            >
              Excel
            </Button>
          </div>

          {/* Botões finais */}
          <div className="flex gap-2 pt-4">
            <Button onClick={handleExport} className="flex-1">
              <FileDown className="h-4 w-4" />
              Exportar
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
