import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { db } from '@/db'
import { qrCodesTable } from '@/db/schema'
import { authMiddleware } from '@/middleware/authMiddleware'
import {
  qrConfigSchema,
  stringifyQRConfig,
} from '@/lib/qrConfiguration/configuration'
import { QRCodeEditor } from '@/lib/qrConfiguration/QRCodeEditor'
import { z } from 'zod'
import ShortUniqueId from 'short-unique-id'

const { randomUUID } = new ShortUniqueId({ length: 8 })

const createQRCode = createServerFn({
  method: 'POST',
})
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      title: z.string().min(1),
      data: z.string().min(1),
      qrConfig: qrConfigSchema,
    }),
  )
  .handler(async ({ data, context }) => {
    const session = context.session

    if (!session?.user?.id) {
      throw new Error('Unauthorized')
    }

    const id = randomUUID()

    await db.insert(qrCodesTable).values({
      id,
      userId: session.user.id,
      type: 'url',
      data: data.data,
      title: data.title,
      qrConfig: stringifyQRConfig(data.qrConfig),
    })

    return { id }
  })

export const Route = createFileRoute('/dashboard/new-code')({
  component: RouteComponent,
  beforeLoad: async () => {
    return { title: 'New QR Code' }
  },
})

function RouteComponent() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Create New QR Code</h2>
      <QRCodeEditor
        loading={loading}
        onSave={async ({ title, data, qrControls }) => {
          setLoading(true)
          setError(null)

          try {
            const result = await createQRCode({
              data: {
                title,
                data,
                qrConfig: qrControls,
              },
            })
            await navigate({
              to: '/dashboard/codes/$id',
              params: { id: result.id },
            })
          } catch (err: any) {
            setError(err.message || 'Failed to create QR code')
            setLoading(false)
          }
        }}
      />
      {error && <div className="mt-4 text-sm text-destructive">{error}</div>}
    </div>
  )
}
