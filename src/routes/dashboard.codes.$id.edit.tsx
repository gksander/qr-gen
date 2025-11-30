import { QRCodeEditor } from '@/components/QRCodeEditor'
import { db } from '@/db'
import { qrCodesTable } from '@/db/schema'
import { authMiddleware } from '@/middleware/authMiddleware'
import {
  createFileRoute,
  useLoaderData,
  useLocation,
  useNavigate,
} from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { and, eq } from 'drizzle-orm'
import { useState } from 'react'
import { z } from 'zod'

const updateQRCode = createServerFn({
  method: 'POST',
})
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      id: z.string(),
      title: z.string().min(1),
      data: z.string().min(1),
    }),
  )
  .handler(async ({ data, context }) => {
    const userId = context.currentUserId

    if (!userId) {
      throw new Error('Unauthorized')
    }

    await db
      .update(qrCodesTable)
      .set({
        title: data.title,
        data: data.data,
      })
      .where(and(eq(qrCodesTable.id, data.id), eq(qrCodesTable.userId, userId)))

    return { success: true }
  })

export const Route = createFileRoute('/dashboard/codes/$id/edit')({
  component: RouteComponent,
})

function RouteComponent() {
  const { code } = useLoaderData({ from: '/dashboard/codes/$id' })
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [_error, setError] = useState<string | null>(null)
  const location = useLocation()

  const forcedQRUrl = new URL(`/c/${code.id}`, location.url).toString()

  return (
    <QRCodeEditor
      forcedQRUrl={forcedQRUrl}
      initialData={{ type: code.type, title: code.title, data: code.data }}
      loading={loading}
      onSave={async ({ title, data }) => {
        setLoading(true)
        setError(null)

        try {
          await updateQRCode({
            data: {
              id: code.id,
              title,
              data,
            },
          })
          await navigate({
            to: '/dashboard/codes/$id',
            params: { id: code.id },
          })
        } catch (err: any) {
          setError(err.message || 'Failed to update QR code')
          setLoading(false)
        }
      }}
    />
  )
}
