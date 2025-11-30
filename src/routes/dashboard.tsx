import { Fragment } from 'react'
import { getUser } from '@/functions/getUser'
import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useRouterState,
} from '@tanstack/react-router'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { DashboardSidebar } from '@/components/DashboardSidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

export const Route = createFileRoute('/dashboard')({
  component: RouteComponent,

  // Grab the user
  beforeLoad: async () => {
    const { session, isAdmin } = await getUser()
    return { session, isAdmin, title: 'Dashboard' }
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
  const matches = useRouterState({ select: (s) => s.matches })

  const breadcrumbs = matches.reduce<{ title: string; path: string }[]>(
    (acc, currentMatch) => {
      const title =
        'title' in currentMatch.context ? currentMatch.context.title : null

      if (!title) {
        return acc
      }

      // If title matches the last breadcrumb, remove the last breadcrumb
      if (acc.at(-1)?.title === title) {
        acc.splice(-1)
      }

      // And add the new breadcrumb
      return [...acc, { title, path: currentMatch.pathname }]
    },
    [],
  )

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
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((breadcrumb, index) => (
                  <Fragment key={breadcrumb.path}>
                    <BreadcrumbItem key={breadcrumb.path}>
                      <BreadcrumbLink asChild>
                        <Link to={breadcrumb.path}>{breadcrumb.title}</Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                  </Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-8">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
