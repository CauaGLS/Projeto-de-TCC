"use client";

import React, { useMemo, useState } from "react";
import { FinanceChart } from "@/components/finance-chart";
import { DataTable } from "@/components/data-table";
import { useFinances } from "@/hooks/useFinances";
import { FinanceCreateCard } from "@/components/finance-create-card";
import { useDeleteFinance } from "@/hooks/useDeleteFinance";
import { useFinanceCreate } from "@/hooks/useFinanceCreate";
import { schema } from "@/components/data-table";
import { z } from "zod";
import { SearchBar, Filters } from "@/components/search-bar";
import { ExportFinanceCard } from "@/components/export-finance-card";

import type { FinanceSchema as ApiFinance } from "@/services/types.gen";

type FinanceRow = z.infer<typeof schema>;

export default function Page() {
  const { data, isLoading, isError } = useFinances();
  const { mutate: deleteFinance } = useDeleteFinance();
  const { showCreate, setShowCreate } = useFinanceCreate();
  const [editing, setEditing] = useState<ApiFinance | null>(null);
  const [filters, setFilters] = useState<Filters>({});
  const [showExport, setShowExport] = useState(false);

  const rows: FinanceRow[] = useMemo(() => {
    if (!data) return [];

    return data
      .filter((f) => {
        if (
          filters.title &&
          !f.title.toLowerCase().includes(filters.title.toLowerCase())
        )
          return false;
        if (
          filters.category &&
          !f.category?.toLowerCase().includes(filters.category.toLowerCase())
        )
          return false;
        if (filters.status && f.status !== filters.status) return false;
        if (filters.type && f.type !== filters.type) return false;

        if (filters.due_date) {
          const due = f.due_date ? f.due_date.slice(0, 10) : null;
          if (due !== filters.due_date) return false;
        }

        if (filters.payment_date) {
          const pay = f.payment_date ? f.payment_date.slice(0, 10) : null;
          if (pay !== filters.payment_date) return false;
        }

        return true;
      })
      .map((f) => ({
        id: Number(f.id),
        title: f.title,
        type: f.type,
        status: f.status,
        value:
          typeof f.value === "number" ? f.value : parseFloat(String(f.value)),
        category: f.category,
        due_date: f.due_date ?? null,
        payment_date: f.payment_date ?? null,
      }));
  }, [data, filters]);

  return (
    <>
      {showCreate && <FinanceCreateCard onClose={() => setShowCreate(false)} />}
      {editing && (
        <FinanceCreateCard finance={editing} onClose={() => setEditing(null)} />
      )}
      {showExport && (
        <ExportFinanceCard onClose={() => setShowExport(false)} data={rows} />
      )}

      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            {isLoading && <div className="px-4">Carregando registros...</div>}
            {isError && (
              <div className="px-4 text-red-500">
                Erro ao carregar registros.
              </div>
            )}

            <SearchBar onApply={setFilters} />

            <DataTable
              data={rows}
              onAddClick={() => setShowCreate(true)}
              onEditClick={(row) => {
                const found =
                  data?.find((f) => Number(f.id) === row.id) ?? null;
                setEditing(found as ApiFinance | null);
              }}
              onDeleteClick={(id) => deleteFinance(id)}
              onExportClick={() => setShowExport(true)}
            />

            <div className="px-4 lg:px-6">
              <FinanceChart />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
