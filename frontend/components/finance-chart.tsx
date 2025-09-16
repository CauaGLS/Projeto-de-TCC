"use client"

import * as React from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useFinances } from "@/hooks/useFinances"
import { useSpendingLimit } from "@/hooks/useSpendingLimit"
import type { FinanceSchema } from "@/services/types.gen"

// Cores fixas
const COLORS = {
  receita: "#22c55e", // verde
  despesa: "#ef4444", // vermelho
  limite: "#eab308", // amarelo
}

function generateMonthRange(center: Date, past = 2, future = 2) {
  const months: string[] = []
  for (let i = -past; i <= future; i++) {
    const d = new Date(center.getFullYear(), center.getMonth() + i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    months.push(key)
  }
  return months
}

export function FinanceChart() {
  const { data: finances = [] } = useFinances()
  const { spendingLimit } = useSpendingLimit()

  const limite = spendingLimit?.value ? Number(spendingLimit.value) : 1000

  const today = new Date()
  const monthRange = generateMonthRange(today, 2, 2)

  const grouped: Record<string, { receita: number; despesa: number; limite: number }> = {}
  for (const m of monthRange) {
    grouped[m] = { receita: 0, despesa: 0, limite }
  }

  finances.forEach((f: FinanceSchema) => {
    const date = f.payment_date
      ? new Date(f.payment_date)
      : f.due_date
      ? new Date(f.due_date)
      : null
    if (!date) return

    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    if (!(key in grouped)) return

    if (f.type === "Receita") {
      grouped[key].receita += Number(f.value)
    } else if (f.type === "Despesa") {
      grouped[key].despesa += Number(f.value)
    }
  })

  const chartData = Object.entries(grouped).map(([month, values]) => ({
    month,
    receita: values.receita === 0 ? 0.01 : values.receita,
    despesa: values.despesa === 0 ? 0.01 : values.despesa,
    limite: values.limite === 0 ? 0.01 : values.limite,
  }))

  const LABELS: Record<string, string> = {
    receita: "Receita",
    despesa: "Despesa",
    limite: "Limite de Gastos",
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparativo Financeiro Mensal</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} barSize={40}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis domain={[0, "auto"]} /> {/* força a não ter negativo */}
            <Tooltip
              cursor={{ fill: "rgba(0,0,0,0.05)" }}
              formatter={(value: number | string, name: string | number) => {
                const key = String(name)
                const label = LABELS[key] ?? key
                const realValue = Number(value) === 0.01 ? 0 : value
                return [`R$ ${Number(realValue).toFixed(2)}`, label]
              }}
              contentStyle={{
                backgroundColor: "white",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
              }}
              shared={false}
            />
            <Bar dataKey="limite" fill={COLORS.limite} name="Limite" radius={6} />
            <Bar dataKey="despesa" fill={COLORS.despesa} name="Despesa" radius={6} />
            <Bar dataKey="receita" fill={COLORS.receita} name="Receita" radius={6} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
