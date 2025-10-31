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
import { toast } from "sonner"

// cores
const COLORS = {
  receita: "#22c55e", // verde
  despesa: "#ef4444", // vermelho
  limite: "#eab308", // amarelo
}

// labels para visualizações
const VIEW_LABELS: Record<string, string> = {
  "7d": "Últimos 7 dias",
  "1m": "Este mês",
  "3m": "Últimos 3 meses",
  "6m": "Últimos 6 meses",
  "1y": "Este ano",
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
  const { data: finances = [] } = useFinances(true)
  const { spendingLimit } = useSpendingLimit(true)
  const [view, setView] = React.useState("3m") // padrão = últimos 3 meses

  const selectedLabel = VIEW_LABELS[view]
  const limite = spendingLimit?.value ?? null
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

    grouped[key] = {
      receita: 0,
      despesa: 0,
      limite: limite ?? Infinity,
      label,
    }
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

  const totalReceita = chartData.reduce((acc, d) => acc + d.receita, 0)
  const totalDespesa = chartData.reduce((acc, d) => acc + d.despesa, 0)
  const percLimite = limite ? ((totalDespesa / limite) * 100).toFixed(1) : null

React.useEffect(() => {
  if (!limite) return
  const percentual = (totalDespesa / limite) * 100

  if (percentual >= 100) {
    toast.error("Limite de gastos atingido!")
  } else if (percentual >= 70) {
    toast.warning("Você está próximo do limite de gastos!")
  }
}, [totalDespesa, limite])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Comparativo Financeiro</CardTitle>
        <div className="flex items-center gap-2">
          {/* menu suspenso */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {selectedLabel}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {Object.entries(VIEW_LABELS).map(([key, label]) => (
                <DropdownMenuItem key={key} onClick={() => setView(key)}>
                  {label}
                </DropdownMenuItem>
              ))}
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

      {/* resumo financeiro estilizado */}
      <div className="flex justify-around px-6 pb-4 text-sm font-medium gap-4">
        <div className="flex items-center gap-2 border rounded-md px-4 py-2 shadow-sm bg-white">
          <span
            className="inline-block size-3 rounded-full"
            style={{ backgroundColor: COLORS.receita }}
          />
          <p className="text-green-600">
            Receita: R$ {totalReceita.toFixed(2)}
          </p>
        </div>
        <div className="flex items-center gap-2 border rounded-md px-4 py-2 shadow-sm bg-white">
          <span
            className="inline-block size-3 rounded-full"
            style={{ backgroundColor: COLORS.despesa }}
          />
          <p className="text-red-600">
            Despesa: R$ {totalDespesa.toFixed(2)}
          </p>
        </div>
        <div className="flex items-center gap-2 border rounded-md px-4 py-2 shadow-sm bg-white">
          <span
            className="inline-block size-3 rounded-full"
            style={{ backgroundColor: COLORS.limite }}
          />
          <p
            className={
              limite
                ? totalDespesa > limite
                  ? "text-red-600"
                  : "text-yellow-600"
                : "text-gray-500"
            }
          >
            Uso do limite: {percLimite ? `${percLimite}%` : "Sem limite"}
          </p>
        </div>
      </div>

      <CardContent>
        <div className="border rounded-md p-2 shadow-sm bg-white">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} barSize={40}>
              <CartesianGrid vertical={false} strokeDasharray="0" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} />
              <YAxis domain={[0, "auto"]} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />

              {limite !== null && (
                <ReferenceLine y={limite} stroke={COLORS.limite} strokeWidth={3} />
              )}

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
        </div>
      </CardContent>
    </Card>
  )
}
