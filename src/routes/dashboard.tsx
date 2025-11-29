import { getUser } from '@/functions/getUser'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

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

    return { isAdmin: context.isAdmin }
  },
})

function RouteComponent() {
  const { isAdmin } = Route.useLoaderData()

  return (
    <div>
      <h1>Dashboard</h1>
      <div>Is admin? {isAdmin ? 'Yes' : 'No'}</div>
      <Outlet />
    </div>
  )
}
