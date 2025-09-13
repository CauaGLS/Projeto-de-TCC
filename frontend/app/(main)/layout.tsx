import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    redirect("/sign-in")
  }

  return (
    <SidebarProvider>
      <SidebarInset className="flex flex-col gap-2 overflow-x-auto overflow-y-hidden p-2 md:gap-4 md:p-4">
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
