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
  ReferenceLine,
} from "recharts"
import { AlertTriangle, HelpCircle } from "lucide-react"
import {
  parseISO,
  format,
  eachDayOfInterval,
  eachMonthOfInterval,
} from "date-fns"
import { ptBR } from "date-fns/locale"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useFinances } from "@/hooks/useFinances"
import { useSpendingLimit } from "@/hooks/useSpendingLimit"
import type { FinanceSchema } from "@/services/types.gen"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import {
  Tooltip as UiTooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip"

// cores
const COLORS = {
  receita: "#22c55e", // verde
  despesa: "#ef4444", // vermelho
  limite: "#eab308", // amarelo
}

// tooltip customizado do gráfico
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null

  return (
    <div className="rounded-md border bg-white px-3 py-2 shadow">
      <p className="text-sm font-medium">{label}</p>
      {payload.map((entry: any, idx: number) => {
        const value = entry.value
        const showAlert =
          entry.dataKey === "despesa" && value >= entry.payload.limite

        return (
          <div key={idx} className="flex items-center gap-1 text-sm">
            <span
              className="mr-1 inline-block size-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            {entry.name}: R$ {value.toFixed(2)}
            {showAlert && (
              <AlertTriangle className="ml-1 size-3 text-red-500" />
            )}
          </div>
        )
      })}
    </div>
  )
}

export function FinanceChart() {
  const { data: finances = [] } = useFinances()
  const { spendingLimit } = useSpendingLimit()
  const [view, setView] = React.useState("3m") // padrão = últimos 3 meses

  const limite = spendingLimit?.value ? Number(spendingLimit.value) : 1000
  const today = new Date()

  // gera intervalo completo (dias ou meses) para mostrar no gráfico, mesmo vazio
  function getDateRange() {
    let end = new Date(today)
    let start = new Date(today)
    let interval: Date[] = []

    switch (view) {
      case "7d":
        start.setDate(start.getDate() - 6)
        interval = eachDayOfInterval({ start, end })
        break
      case "1m":
        start = new Date(today.getFullYear(), today.getMonth(), 1)
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        interval = eachDayOfInterval({ start, end })
        break
      case "3m":
        start.setMonth(start.getMonth() - 2)
        interval = eachMonthOfInterval({ start, end })
        break
      case "6m":
        start.setMonth(start.getMonth() - 5)
        interval = eachMonthOfInterval({ start, end })
        break
      case "1y":
        start.setFullYear(start.getFullYear() - 1)
        interval = eachMonthOfInterval({ start, end })
        break
    }
    return interval
  }

  const range = getDateRange()

  // inicia estrutura de dados vazia
  const grouped: Record<
    string,
    { receita: number; despesa: number; limite: number; label: string }
  > = {}

  range.forEach((d) => {
    const key =
      view === "7d" || view === "1m"
        ? format(d, "yyyy-MM-dd")
        : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`

    const label =
      view === "7d" || view === "1m"
        ? format(d, "dd/MM")
        : format(d, "MMM", { locale: ptBR })

    grouped[key] = { receita: 0, despesa: 0, limite, label }
  })

  // acumula dados
  finances.forEach((f: FinanceSchema) => {
    const date = f.payment_date
      ? parseISO(f.payment_date)
      : f.due_date
      ? parseISO(f.due_date)
      : null
    if (!date) return

    const key =
      view === "7d" || view === "1m"
        ? format(date, "yyyy-MM-dd")
        : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

    if (!(key in grouped)) return

    if (f.type === "Receita") {
      grouped[key].receita += Number(f.value)
    } else if (f.type === "Despesa") {
      grouped[key].despesa += Number(f.value)
    }
  })

  const chartData = Object.values(grouped)

  // resumo
  const totalReceita = chartData.reduce((acc, d) => acc + d.receita, 0)
  const totalDespesa = chartData.reduce((acc, d) => acc + d.despesa, 0)
  const percLimite = ((totalDespesa / limite) * 100).toFixed(1)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Comparativo Financeiro</CardTitle>
        <div className="flex items-center gap-2">
          {/* menu suspenso */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Visualização
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setView("7d")}>
                Últimos 7 dias
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setView("1m")}>
                Este mês
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setView("3m")}>
                Últimos 3 meses
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setView("6m")}>
                Últimos 6 meses
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setView("1y")}>
                Este ano
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* tooltip de ajuda */}
          <TooltipProvider>
            <UiTooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="size-5 cursor-pointer text-gray-500" />
              </TooltipTrigger>
              <TooltipContent
                side="left"
                className="bg-white text-gray-900 border shadow-lg rounded-md px-3 py-2 leading-relaxed space-y-2"
              >
                <p>
                  <span className="text-green-600">▮ Receita</span>: Entradas
                </p>
                <p>
                  <span className="text-red-600">▮ Despesa</span>: Saídas
                </p>
                <p>
                  <span className="text-yellow-500">━ Limite</span>: Limite
                </p>
                <p>
                  <AlertTriangle className="inline size-3 text-red-500" />:
                  Limite ultrapassado
                </p>
              </TooltipContent>
            </UiTooltip>
          </TooltipProvider>
        </div>
      </CardHeader>

      {/* resumo financeiro */}
      <div className="flex justify-around px-6 pb-2 text-sm font-medium">
        <p className="text-green-600">Receita: R$ {totalReceita.toFixed(2)}</p>
        <p className="text-red-600">Despesa: R$ {totalDespesa.toFixed(2)}</p>
        <p
          className={
            totalDespesa > limite ? "text-red-600" : "text-yellow-600"
          }
        >
          Uso do limite: {percLimite}%
        </p>
      </div>

      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} barSize={40}>
            <CartesianGrid vertical={false} strokeDasharray="0" />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              minTickGap={20} // espaçamento maior para dias
            />
            <YAxis domain={[0, "auto"]} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={limite} stroke={COLORS.limite} strokeWidth={3} />
            <Bar
              dataKey="despesa"
              fill={COLORS.despesa}
              name="Despesa"
              radius={4}
              animationDuration={600}
            />
            <Bar
              dataKey="receita"
              fill={COLORS.receita}
              name="Receita"
              radius={4}
              animationDuration={600}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
