"use client"

import React, { useMemo, useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { useFinances } from "@/hooks/useFinances"
import { FinanceCreateCard } from "@/components/finance-create-card"
import { useDeleteFinance } from "@/hooks/useDeleteFinance"
import { useUpdateFinance } from "@/hooks/useUpdateFinance"

// importe o tipo correto do SDK do heyapi
import type { FinanceSchema as ApiFinance } from "@/services/types.gen"

type FinanceRow = {
  id: number
  titulo: string
  valor: number
  tipo: string
  categoria: string
  status: string
}

export default function Page() {
  const { data, isLoading, isError } = useFinances()
  const { mutate: deleteFinance } = useDeleteFinance()
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<ApiFinance | null>(null)

  // transforma API → rows que a tabela espera
  const rows: FinanceRow[] = useMemo(() => {
    if (!data) return []
    return data.map((f) => ({
      id: Number(f.id),
      titulo: f.title,
      tipo: f.type,
      status: f.status,
      valor: typeof f.value === "number" ? f.value : parseFloat(String(f.value)),
      categoria: f.category,
    }))
  }, [data])

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />

        {showCreate && <FinanceCreateCard onClose={() => setShowCreate(false)} />}

        {/* quando editar, passamos o objeto da API (ApiFinance) */}
        {editing && (
          <FinanceCreateCard
            finance={editing}
            onClose={() => setEditing(null)}
          />
        )}

        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {isLoading && <div className="px-4">Carregando registros...</div>}
              {isError && (
                <div className="px-4 text-red-500">Erro ao carregar registros.</div>
              )}

              <DataTable
                data={rows}
                onAddClick={() => setShowCreate(true)}
                onEditClick={(row) => {
                  // row: FinanceRow — precisamos obter o objeto completo da API
                  const found = data?.find((f) => Number(f.id) === row.id) ?? null
                  setEditing(found as ApiFinance | null)
                }}
                onDeleteClick={(id) => {
                  // seu hook pode esperar apenas o id; se o hook exigir { financeId } ajuste aqui
                  deleteFinance(id)
                }}
              />

              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
