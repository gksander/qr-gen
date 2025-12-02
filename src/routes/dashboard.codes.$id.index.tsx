import { QRCodeDetailLayout } from '@/components/QRCodeDetailLayout'
import { TEMPLATES } from '@/lib/qrConfiguration/templates/template'
import { parseQRConfig } from '@/lib/qrConfiguration/configuration'
import { createFileRoute, Link, useLoaderData } from '@tanstack/react-router'
import { useMemo } from 'react'

export const Route = createFileRoute('/dashboard/codes/$id/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { code } = useLoaderData({ from: '/dashboard/codes/$id' })

  // Parse and validate qrConfig from database
  const qrConfig = useMemo(() => parseQRConfig(code.qrConfig), [code.qrConfig])

  const activeTemplate = TEMPLATES[qrConfig.template]

  // Type-safe control values for the Component
  const typedControlValues = useMemo(() => {
    const typed: Record<string, unknown> = {}
    Object.entries(activeTemplate.controls).forEach(([key, control]) => {
      typed[key] = qrConfig.controlValues[key] ?? control.defaultValue
    })
    return typed as {
      [K in keyof typeof activeTemplate.controls]: (typeof activeTemplate.controls)[K]['defaultValue']
    }
  }, [activeTemplate, qrConfig.controlValues])

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
        <activeTemplate.Component
          data={code.data}
          controlValues={typedControlValues as any}
        />
      }
    />
  )
}
