import { createFileRoute, redirect } from '@tanstack/react-router'
import { getUser } from '@/functions/getUser'

export const Route = createFileRoute('/dashboard/admin/users')({
  component: RouteComponent,
  beforeLoad: async () => {
    const { isAdmin } = await getUser()
    if (!isAdmin) {
      throw redirect({
        to: '/dashboard',
      })
    }
  },
})

function RouteComponent() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Users</h2>
      <p>This page will show user management options.</p>
    </div>
  )
}

