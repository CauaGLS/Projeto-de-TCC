"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { useFinances } from "@/hooks/useFinances"
import { useSpendingLimit } from "@/hooks/useSpendingLimit" // hook para buscar o limite definido

// Configuração das cores e labels
const chartConfig = {
  receita: {
    label: "Receita",
    color: "hsl(var(--chart-1))",
  },
  despesa: {
    label: "Despesa",
    color: "hsl(var(--chart-2))",
  },
  limite: {
    label: "Limite de Gastos",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig

export function FinanceChart() {
  const { data: finances = [] } = useFinances()
  const { spendingLimit } = useSpendingLimit()

  // calcular totais
  const receitaTotal = finances
    .filter((f) => f.type === "Receita")
    .reduce((acc, f) => acc + Number(f.value), 0)

  const despesaTotal = finances
    .filter((f) => f.type === "Despesa")
    .reduce((acc, f) => acc + Number(f.value), 0)

  const limite = spendingLimit?.value ? Number(spendingLimit.value) : 1000

  const chartData = [
    { name: "Receita", receita: receitaTotal },
    { name: "Despesa", despesa: despesaTotal },
    { name: "Limite", limite: limite },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparativo Financeiro</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={chartData} barSize={60}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="receita" fill="var(--color-receita)" radius={8} />
            <Bar dataKey="despesa" fill="var(--color-despesa)" radius={8} />
            <Bar dataKey="limite" fill="var(--color-limite)" radius={8} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
