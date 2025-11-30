import { QRCodeEditor } from '@/components/QRCodeEditor'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/build')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="p-8">
      <QRCodeEditor />
    </div>
  )
}
