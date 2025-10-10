"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface GoalCardProps {
  goal: {
    id: number
    title: string
    target_value: number
    current_value: number
    deadline_date?: string | null
  }
  onView: (id: number) => void
}

export function GoalCard({ goal, onView }: GoalCardProps) {
  const progress = Math.min((goal.current_value / goal.target_value) * 100, 100)

  return (
    <Card
      className="shadow-md hover:shadow-lg transition-all cursor-pointer"
      onClick={() => onView(goal.id)}
    >
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{goal.title}</CardTitle>
        {goal.deadline_date && (
          <p className="text-xs text-muted-foreground mt-1">
            Data limite:{" "}
            {new Date(goal.deadline_date).toLocaleDateString("pt-BR")}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={progress} />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>R$ {goal.current_value.toFixed(2)}</span>
          <span>R$ {goal.target_value.toFixed(2)}</span>
        </div>
      </CardContent>
    </Card>
  )
}
