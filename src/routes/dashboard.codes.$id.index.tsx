import { QRCodeDetailLayout } from '@/components/QRCodeDetailLayout'
import { QRCodeSVG } from '@/components/QRCodeSVG'
import { createFileRoute, Link, useLoaderData } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/codes/$id/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { code } = useLoaderData({ from: '/dashboard/codes/$id' })

  return (
    <QRCodeDetailLayout
      leftContent={
        <div className="space-y-4">
          <div>
            <Link to="/dashboard/codes/$id/edit" params={{ id: code.id }}>
              Edit
            </Link>
          </div>

          <div>
            <div className="text-sm font-medium text-muted-foreground">ID</div>
            <div className="text-sm font-mono">{code.id}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">
              Type
            </div>
            <div className="text-sm">{code.type}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">
              Data
            </div>
            <div className="text-sm break-all">{code.data}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">
              Created
            </div>
            <div className="text-sm">
              {code.createdAt
                ? new Date(code.createdAt).toLocaleString()
                : 'Unknown date'}
            </div>
          </div>
        </div>
      }
      rightContent={
        <QRCodeSVG data={code.data} typeNumber={3} errorCorrectionLevel="M" />
      }
    />
  )
}
