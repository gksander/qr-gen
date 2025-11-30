import { getUser } from '@/functions/getUser'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { DashboardSidebar } from '@/components/DashboardSidebar'

export const Route = createFileRoute('/dashboard')({
  component: RouteComponent,

  // Grab the user
  beforeLoad: async () => {
    const { session, isAdmin } = await getUser()
    return { session, isAdmin }
  },

  // Validate we have active session, and expose "isAdmin" to the route component for custom display
  loader: async ({ context, location }) => {
    if (!context.session) {
      throw redirect({
        to: '/sign-in',
        search: {
          redirectTo: location.pathname,
        },
      })
    }

    return {
      isAdmin: context.isAdmin || false,
      name: context.session?.user?.name,
    }
  },
})

function RouteComponent() {
  const { isAdmin, name } = Route.useLoaderData()

  return (
    <SidebarProvider>
      <DashboardSidebar isAdmin={isAdmin} userName={name} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">Dashboard</h1>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-8">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
