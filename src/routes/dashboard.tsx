import { Button } from '@/components/ui/button'
import { getUser } from '@/functions/getUser'
import { authClient } from '@/lib/auth-client'
import {
  createFileRoute,
  Outlet,
  redirect,
  useNavigate,
} from '@tanstack/react-router'

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
  const navigate = useNavigate()

  return (
    <div>
      <h1>Dashboard {name}</h1>
      <div>Is admin? {isAdmin ? 'Yes' : 'No'}</div>
      <Button
        onClick={() =>
          authClient.signOut({
            fetchOptions: {
              onSuccess: () => navigate({ to: '/' }),
            },
          })
        }
      >
        Sign out
      </Button>
      <Outlet />
    </div>
  )
}
