"use client"

import { createContext, useContext, useState } from "react"
import { FinanceCreateCard } from "@/components/finance-create-card"

type FinanceCreateContextType = {
  showCreate: boolean
  setShowCreate: (v: boolean) => void
}

const FinanceCreateContext = createContext<FinanceCreateContextType>({
  showCreate: false,
  setShowCreate: () => {},
})

export function FinanceCreateProvider({ children }: { children: React.ReactNode }) {
  const [showCreate, setShowCreate] = useState(false)

  return (
    <FinanceCreateContext.Provider value={{ showCreate, setShowCreate }}>
      {children}
      {showCreate && <FinanceCreateCard onClose={() => setShowCreate(false)} />}
    </FinanceCreateContext.Provider>
  )
}

export function useFinanceCreate() {
  return useContext(FinanceCreateContext)
}
