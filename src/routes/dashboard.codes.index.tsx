import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/codes/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Existing QR Codes</h2>
      <p>This page will show your existing QR codes.</p>
    </div>
  )
}
