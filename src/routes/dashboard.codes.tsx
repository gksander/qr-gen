import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/codes')({
  component: RouteComponent,
  beforeLoad: async () => {
    return { title: 'Codes' }
  },
})

function RouteComponent() {
  return <Outlet />
}
