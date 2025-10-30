"use client"

import { useState } from "react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {

      const { data, error } = await authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      })

      setLoading(false)

      if (error) {
        const msg = error.message || "E-mail não encontrado."; // MSG018
        setMessage(msg)
        toast.error(msg)
      } else {
        const ok = "Um link foi enviado para o email fornecido." // custom confirm
        setMessage(ok)
        toast.success(ok)
      }
    } catch (err: any) {
      setLoading(false)
      const msg = err?.message || "Erro ao enviar email de recuperação."
      setMessage(msg)
      toast.error(msg)
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Recuperar senha</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              required
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {message && <p className="text-sm text-muted-foreground">{message}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? "Enviando..." : "Enviar link"}
          </Button>
          <a
            href="/sign-in"
            className="text-center text-sm underline-offset-4 hover:underline"
          >
            Voltar
          </a>
        </form>
      </CardContent>
    </Card>
  )
}
