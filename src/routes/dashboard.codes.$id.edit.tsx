import { QRCodeDetailLayout } from '@/components/QRCodeDetailLayout'
import {
  createFileRoute,
  useLoaderData,
  useNavigate,
} from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { db } from '@/db'
import { qrCodesTable } from '@/db/schema'
import { authMiddleware } from '@/middleware/authMiddleware'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { z } from 'zod'
import { eq, and } from 'drizzle-orm'

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
  const [title, setTitle] = useState(code.title)
  const [data, setData] = useState(code.data)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
      await navigate({ to: '/dashboard/codes/$id', params: { id: code.id } })
    } catch (err: any) {
      setError(err.message || 'Failed to update QR code')
      setLoading(false)
    }
  }

  return (
    <QRCodeDetailLayout
      leftContent={
        <div>
          <h2 className="text-2xl font-bold mb-4">Edit QR Code</h2>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-2">
                Title
              </label>
              <Input
                id="title"
                type="text"
                placeholder="Enter title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={loading}
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="data" className="block text-sm font-medium mb-2">
                Data
              </label>
              <Input
                id="data"
                type="text"
                placeholder="Enter data (e.g., URL)"
                value={data}
                onChange={(e) => setData(e.target.value)}
                required
                disabled={loading}
                className="w-full"
              />
            </div>
            {error && <div className="text-sm text-destructive">{error}</div>}
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={() =>
                  navigate({
                    to: '/dashboard/codes/$id',
                    params: { id: code.id },
                  })
                }
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      }
      rightContent={<div>Preview will go here</div>}
    />
  )
}
