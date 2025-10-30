"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export function ResetPasswordForm() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get("token")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError("A senha deve ter no mínimo 8 caracteres.")
      toast.error("A senha deve ter no mínimo 8 caracteres.")
      return
    }

    if (password !== confirmPassword) {
      setError("As senhas não conferem.")
      toast.error("As senhas não conferem.")
      return
    }

    setLoading(true)
    
    try {
      const { error } = await authClient.resetPassword({
        token: token || "",
        newPassword: password,
      })
      setLoading(false)

      if (error) {
        const msg = error.message || "Erro ao redefinir senha."
        setError(msg)
        toast.error(msg)
        return
      }

      toast.success("Senha redefinida.") // MSG011
      router.push("/sign-in")
    } catch (err: any) {
      setLoading(false)
      const msg = err?.message || "Erro ao redefinir senha."
      setError(msg)
      toast.error(msg)
    }
  }

  if (!token) {
    return <p>Token inválido</p>
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Redefinir senha</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="password">Nova senha</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirm">Confirmar senha</Label>
            <Input
              id="confirm"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Salvar nova senha"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
