"use client"

import React, { useMemo, useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { FinanceChart } from "@/components/finance-chart"
import { DataTable } from "@/components/data-table"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { useFinances } from "@/hooks/useFinances"
import { FinanceCreateCard } from "@/components/finance-create-card"
import { useDeleteFinance } from "@/hooks/useDeleteFinance"
import { useFinanceCreate } from "@/hooks/useFinanceCreate"
import { schema } from "@/components/data-table"
import { z } from "zod"

import type { FinanceSchema as ApiFinance } from "@/services/types.gen"

type FinanceRow = z.infer<typeof schema>


export default function Page() {
  const { data, isLoading, isError } = useFinances()
  const { mutate: deleteFinance } = useDeleteFinance()
  const { showCreate, setShowCreate } = useFinanceCreate()
  const [editing, setEditing] = useState<ApiFinance | null>(null)

const rows: FinanceRow[] = useMemo(() => {
  if (!data) return []
  return data.map((f) => ({
    id: Number(f.id),
    title: f.title,
    type: f.type,
    status: f.status,
    value: typeof f.value === "number" ? f.value : parseFloat(String(f.value)),
    category: f.category,
    due_date: f.due_date ?? null,
    payment_date: f.payment_date ?? null,
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
                  const found = data?.find((f) => Number(f.id) === row.id) ?? null
                  setEditing(found as ApiFinance | null)
                }}
                onDeleteClick={(id) => deleteFinance(id)}
              />
              <div className="px-4 lg:px-6">
                <FinanceChart />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
