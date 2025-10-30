"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useSession, authClient } from "@/lib/auth-client";
import { useProfilePhoto } from "@/hooks/useProfilePhoto";
import { useDeleteUser } from "@/hooks/useDeleteUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

export default function ProfilePage() {
  const { data: session } = useSession();
  const user = session?.user;
  const { uploadPhoto } = useProfilePhoto();
  const deleteUser = useDeleteUser();

  const [username, setUsername] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.name || "");
      setPreview(user.image || "");
    }
  }, [user]);

  const isGoogleUser =
    user?.email?.endsWith("@gmail.com") ||
    (user?.image && user.image.includes("googleusercontent"));

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      setPreview(URL.createObjectURL(file));
    }
  }

  async function handleNameChange() {
    if (!username.trim()) {
      toast.error("O nome não pode estar vazio.");
      return;
    }
    try {
      await authClient.updateUser({ name: username });
      await authClient.getSession();
      toast.success("Nome atualizado com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao atualizar o nome do usuário.");
    }
  }

  async function handlePasswordChange() {
    if (!currentPassword.trim() || !newPassword.trim()) {
      toast.error("Preencha todos os campos de senha.");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("A senha deve ter no mínimo 8 caracteres.");
      return;
    }

    try {
      setIsChangingPassword(true);

      const { data, error } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });

      if (error) {
        const code =
          (error as any)?.response?.data?.code ||
          (error as any)?.code ||
          (error as any)?.message;

        if (
          code === "INVALID_PASSWORD" ||
          code === "Invalid password" ||
          (typeof code === "string" &&
            code.toLowerCase().includes("invalid password"))
        ) {
          toast.error("Senha atual incorreta.");
        } else {
          toast.error("Erro ao alterar a senha.");
        }
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      toast.success("Senha redefinida.");
    } catch (err: any) {
      console.error(err);
      const message = err?.message?.toLowerCase() || "";
      if (message.includes("invalid password")) {
        toast.error("Senha atual incorreta.");
      } else {
        toast.error("Erro ao alterar a senha.");
      }
    } finally {
      setIsChangingPassword(false);
    }
  }

  async function handlePhotoUpload() {
    if (!photo) {
      toast.error("Selecione uma imagem antes de salvar.");
      return;
    }
    try {
      const imageUrl = await uploadPhoto.mutateAsync(photo);
      if (imageUrl) {
        await authClient.updateUser({ image: imageUrl });
        await authClient.getSession();
        setPreview(imageUrl);
        toast.success("Foto de perfil atualizada!");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao enviar a imagem.");
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-white text-gray-900">
      {/* Banner */}
      <div className="w-full bg-gray-100 py-10 flex flex-col items-center border-b">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-300 mb-3">
          {preview?.startsWith("blob:") ? (
            <img
              src={preview}
              alt="Pré-visualização"
              className="object-cover w-full h-full"
            />
          ) : (
            <Image
              src={
                preview?.startsWith("http")
                  ? preview
                  : preview
                  ? `${process.env.NEXT_PUBLIC_MINIO_URL?.replace(/\/$/, "")}/${preview.replace(/^\/+/, "")}`
                  : "/default-avatar.png"
              }
              alt="Foto de perfil"
              width={112}
              height={112}
              className="object-cover w-full h-full"
            />
          )}
        </div>
        <h2 className="text-2xl font-semibold">{user?.name || "Usuário"}</h2>
        <p className="text-gray-500">{user?.email}</p>
      </div>

      {/* Card principal */}
      <Card className="mt-10 p-10 w-[95%] shadow-md border rounded-xl bg-gray-50">
        {isGoogleUser ? (
          <div className="flex flex-col items-center text-center space-y-6">
            <p className="text-gray-600 max-w-md">
              Sua conta está vinculada ao Google. Alterações de senha e nome
              devem ser feitas diretamente na sua conta Google.
            </p>
            <Button
              variant="destructive"
              onClick={() => setOpenDeleteDialog(true)}
            >
              Excluir Conta
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-start">
              {/* Coluna 1 – Foto */}
              <div className="flex flex-col items-center space-y-4">
                <div className="w-28 h-28 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                  {preview?.startsWith("blob:") ? (
                    <img
                      src={preview}
                      alt="Pré-visualização"
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <Image
                      src={
                        preview?.startsWith("http")
                          ? preview
                          : preview
                          ? `${process.env.NEXT_PUBLIC_MINIO_URL?.replace(/\/$/, "")}/${preview.replace(/^\/+/, "")}`
                          : "/default-avatar.png"
                      }
                      alt="Foto de perfil"
                      width={112}
                      height={112}
                      className="object-cover w-full h-full"
                    />
                  )}
                </div>

                <Input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  id="photo"
                  className="hidden"
                />

                <div className="flex flex-col space-y-2 w-full">
                  <Button
                    asChild
                    className="bg-black text-white hover:bg-gray-800"
                  >
                    <label htmlFor="photo">Selecionar Foto</label>
                  </Button>
                  <Button
                    onClick={handlePhotoUpload}
                    className="bg-black hover:bg-gray-800 text-white"
                  >
                    Salvar Foto
                  </Button>
                </div>
              </div>

              {/* Coluna 2 – Nome */}
              <div className="flex flex-col space-y-4">
                <div>
                  <Label className="mb-2 block">Nome de Usuário</Label>
                  <Input
                    type="text"
                    placeholder="Novo nome de usuário"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="mb-3"
                  />
                </div>
                <Button
                  onClick={handleNameChange}
                  className="bg-black hover:bg-gray-800 text-white"
                >
                  Salvar
                </Button>
              </div>

              {/* Coluna 3 – Senhas */}
              <div className="flex flex-col space-y-4">
                <div>
                  <Label className="mb-2 block">Senha Atual</Label>
                  <Input
                    type="password"
                    placeholder="Digite sua senha atual"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="mb-3"
                  />
                </div>
                <div>
                  <Label className="mb-2 block">Nova Senha</Label>
                  <Input
                    type="password"
                    placeholder="Digite a nova senha"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mb-3"
                  />
                </div>
                <Button
                  onClick={handlePasswordChange}
                  className="bg-black hover:bg-gray-800 text-white flex items-center justify-center"
                  disabled={isChangingPassword}
                >
                  {isChangingPassword && (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  )}
                  Redefinir
                </Button>
              </div>
            </div>

            <Separator className="my-10 bg-gray-300" />
            <div className="flex justify-center">
              <Button
                variant="destructive"
                onClick={() => setOpenDeleteDialog(true)}
              >
                Excluir Conta
              </Button>
            </div>
          </>
        )}
      </Card>

      {/* Dialog de confirmação */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir conta</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir sua conta? Esta ação é permanente e
              removerá todos os seus dados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setOpenDeleteDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                deleteUser.mutate();
                setOpenDeleteDialog(false);
              }}
              disabled={deleteUser.isPending}
            >
              {deleteUser.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
