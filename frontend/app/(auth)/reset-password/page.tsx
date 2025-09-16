import { headers } from "next/headers"
import { redirect } from "next/navigation"
import Image from "next/image"
import { auth } from "@/lib/auth"
import { ResetPasswordForm } from "@/components/reset-password-form"

export default async function ResetPasswordPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) redirect("/")

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-muted p-6 md:p-10">
      <a href="#" className="flex items-center gap-2 font-medium mb-2">
        <Image src="/logo.svg" alt="Logo" width={42} height={42} />
      </a>
      <ResetPasswordForm />
    </div>
  )
}
