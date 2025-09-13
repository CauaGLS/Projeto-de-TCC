import { headers } from "next/headers"
import { redirect } from "next/navigation"
import Image from "next/image"
import { auth } from "@/lib/auth"
import { SignUpForm } from "@/components/sign-up-form"

export default async function SignUpPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) redirect("/")

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <Image src="/logo.svg" alt="Logo" width={42} height={42} />
        </a>
        <SignUpForm />
      </div>
    </div>
  )
}
