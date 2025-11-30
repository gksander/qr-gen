import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/codes/new')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Create New QR Code</h2>
      <p>This page will allow you to create a new QR code.</p>
    </div>
  )
}
