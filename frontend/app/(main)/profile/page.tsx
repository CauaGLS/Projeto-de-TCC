"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useSession, authClient } from "@/lib/auth-client";
import { useProfilePhoto } from "@/hooks/useProfilePhoto";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function ProfilePage() {
  const { data: session } = useSession();
  const user = session?.user;
  const { uploadPhoto } = useProfilePhoto();

  // Estados locais
  const [username, setUsername] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // ✅ Atualiza estados sempre que a sessão mudar
  useEffect(() => {
    if (user) {
      setUsername(user.name || "");
      setPreview(user.image || "");
    }
  }, [user]);

  // Detecta se o login foi via Google
  const isGoogleUser =
    user?.email?.endsWith("@gmail.com") ||
    (user?.image && user.image.includes("googleusercontent"));

  // Handle de imagem
  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      setPreview(URL.createObjectURL(file)); // mostra preview antes do upload
    }
  }

  // Atualizar nome de usuário
  async function handleNameChange() {
    if (!username.trim()) return;
    try {
      await authClient.updateUser({ name: username });
      await authClient.getSession(); // força atualização da sessão local
    } catch (error) {
      console.error(error);
    }
  }

  // Atualizar senha
  async function handlePasswordChange() {
    if (!currentPassword.trim() || !newPassword.trim()) return;
    try {
      await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });
      setCurrentPassword("");
      setNewPassword("");
    } catch (error) {
      console.error(error);
    }
  }

  // Upload de imagem (usando hook)
  async function handlePhotoUpload() {
    if (!photo) return;

    try {
      const imageUrl = await uploadPhoto.mutateAsync(photo);

      if (imageUrl) {
        await authClient.updateUser({ image: imageUrl });
        await authClient.getSession(); // atualiza sessão local
        setPreview(imageUrl); // atualiza o preview também
      }
    } catch (error) {
      console.error(error);
    }
  }

  // Excluir conta
  async function handleDeleteAccount() {
    const confirmDelete = confirm(
      "Tem certeza que deseja excluir sua conta? Essa ação é irreversível."
    );
    if (!confirmDelete) return;

    try {
      await authClient.deleteUser();
      window.location.href = "/";
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-white text-gray-900">
      {/* Banner do usuário */}
      <div className="w-full bg-gray-100 py-10 flex flex-col items-center border-b">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-300 mb-3">
          {preview?.startsWith("blob:") ? (
            // 👇 se for uma URL local (blob), renderiza com <img> normal
            <img
              src={preview}
              alt="Pré-visualização"
              className="object-cover w-full h-full"
            />
          ) : (
            // 👇 caso contrário, usa o Next Image otimizado
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
              Sua conta está vinculada ao Google. Por segurança, alterações de
              senha, nome e foto devem ser feitas diretamente na sua conta
              Google.
            </p>
            <Button variant="destructive" onClick={handleDeleteAccount}>
              Excluir Conta
            </Button>
          </div>
        ) : (
          <>
            {/* Layout de três colunas alinhado */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-start">
              {/* Coluna 1 – Foto */}
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-28 h-28 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {preview?.startsWith("blob:") ? (
                    // 👇 se for uma URL local (blob), renderiza com <img> normal
                    <img
                      src={preview}
                      alt="Pré-visualização"
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    // 👇 caso contrário, usa o Next Image otimizado
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
                  className="hidden"
                  id="photo"
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
              <div className="flex flex-col justify-center space-y-4">
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
              <div className="flex flex-col justify-center space-y-4">
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
                  className="bg-black hover:bg-gray-800 text-white"
                >
                  Redefinir
                </Button>
              </div>
            </div>

            <Separator className="my-10 bg-gray-300" />
            <div className="flex justify-center">
              <Button variant="destructive" onClick={handleDeleteAccount}>
                Excluir Conta
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
