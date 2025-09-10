"use client"
import { createContext, useContext, useState, ReactNode } from "react"

type FinanceCreateContextType = {
  showCreate: boolean
  setShowCreate: (value: boolean) => void
}

const FinanceCreateContext = createContext<FinanceCreateContextType | undefined>(undefined)

export function FinanceCreateProvider({ children }: { children: ReactNode }) {
  const [showCreate, setShowCreate] = useState(false)

  return (
    <FinanceCreateContext.Provider value={{ showCreate, setShowCreate }}>
      {children}
    </FinanceCreateContext.Provider>
  )
}

export function useFinanceCreate() {
  const ctx = useContext(FinanceCreateContext)
  if (!ctx) throw new Error("useFinanceCreate deve ser usado dentro de FinanceCreateProvider")
  return ctx
}
