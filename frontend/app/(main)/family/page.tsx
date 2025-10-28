"use client";

import { useState } from "react";
import { useFamily } from "@/hooks/useFamily";
import { useSession } from "@/lib/auth-client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { UserMinus } from "lucide-react";

export default function FamilyPage() {
  const { data: session } = useSession();
  const {
    family,
    familyUsers,
    createFamily,
    joinFamily,
    leaveFamily,
    removeMember,
  } = useFamily();

  const [mode, setMode] = useState<"create" | "join">("create");
  const [familyName, setFamilyName] = useState("");
  const [joinCode, setJoinCode] = useState("");

  const isCreator = family.data?.created_by?.id === session?.user?.id;

  // --- Ações ---
  function handleCreate() {
    if (!familyName.trim()) return;
    createFamily.mutate(
      { name: familyName },
      {
        onSuccess: () => {
          toast.success("Família criada com sucesso!");
          setFamilyName("");
        },
        onError: () => toast.error("Erro ao criar família."),
      }
    );
  }

  function handleJoin() {
    if (!joinCode.trim()) return;
    joinFamily.mutate(
      { code: joinCode },
      {
        onSuccess: () => {
          toast.success("Você entrou na família com sucesso!");
          setJoinCode("");
        },
        onError: () => toast.error("Código inválido."),
      }
    );
  }

  function handleLeave() {
    leaveFamily.mutate(undefined, {
      onSuccess: () => toast.success("Você saiu da família."),
      onError: () => toast.error("Erro ao sair da família."),
    });
  }

  // --- Quando o usuário ainda não está em uma família ---
  if (!family.data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-6">
        <h1 className="text-2xl font-bold text-center">
          Gerenciamento de Família
        </h1>

        {/* Alternador visual estilo exportação */}
        <div className="flex bg-muted rounded-lg p-1 w-[320px]">
          <button
            onClick={() => setMode("create")}
            className={cn(
              "flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all",
              mode === "create"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Criar Família
          </button>
          <button
            onClick={() => setMode("join")}
            className={cn(
              "flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all",
              mode === "join"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Entrar na Família
          </button>
        </div>

        {/* Formulário dinâmico */}
        <Card className="w-full max-w-md mt-4">
          <CardHeader>
            <CardTitle className="text-center">
              {mode === "create"
                ? "Criar Nova Família"
                : "Entrar em uma Família"}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {mode === "create" ? (
              <>
                <Label htmlFor="familyName">Nome da Família</Label>
                <Input
                  id="familyName"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder="Ex: Família Silva"
                />
              </>
            ) : (
              <>
                <Label htmlFor="familyCode">Código da Família</Label>
                <Input
                  id="familyCode"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Insira o código"
                />
              </>
            )}
          </CardContent>

          <CardFooter>
            <Button
              onClick={mode === "create" ? handleCreate : handleJoin}
              className="w-full"
              disabled={createFamily.isPending || joinFamily.isPending}
            >
              {mode === "create" ? "Criar Família" : "Entrar na Família"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // --- Tela principal da família ---
  return (
    <div className="max-w-4xl mx-auto py-10 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">{family.data.name}</h1>
        <p className="text-muted-foreground mt-1">
          Código da Família:{" "}
          <span className="font-mono font-semibold">{family.data.code}</span>
        </p>
      </div>

      <Separator />

      {/* Lista de membros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Membros da Família
          </CardTitle>
        </CardHeader>

        <CardContent className="grid gap-4 md:grid-cols-2">
          {familyUsers.data?.length ? (
            familyUsers.data.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between border rounded-lg p-3 hover:bg-muted/50 transition"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
                  <Avatar className="flex-shrink-0">
                    <AvatarImage
                      src={user.image || undefined}
                      alt={user.name || "Usuário"}
                    />
                    <AvatarFallback>
                      {user.name?.slice(0, 2).toUpperCase() ?? "??"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1 overflow-hidden">
                    <p className="font-medium truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                </div>

                {isCreator && user.id !== session?.user?.id && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() =>
                      removeMember.mutate(user.id, {
                        onSuccess: () =>
                          toast.success(`${user.name} foi removido.`),
                        onError: () => toast.error("Erro ao remover membro."),
                      })
                    }
                    className="flex-shrink-0 ml-2"
                  >
                    <UserMinus className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-sm">
              Nenhum membro encontrado.
            </p>
          )}
        </CardContent>

        <CardFooter>
          <Button
            variant="destructive"
            onClick={handleLeave}
            disabled={leaveFamily.isPending}
            className="w-full"
          >
            Sair da Família
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
