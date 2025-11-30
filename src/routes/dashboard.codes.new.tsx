import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { db } from '@/db'
import { qrCodesTable } from '@/db/schema'
import { authMiddleware } from '@/middleware/authMiddleware'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { z } from 'zod'
import ShortUniqueId from 'short-unique-id'

const { randomUUID } = new ShortUniqueId({ length: 8 })

const createQRCode = createServerFn({
  method: 'POST',
})
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      url: z.url(),
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
      data: data.url,
      qrConfig: JSON.stringify({}),
    })

    // TODO: throwing redirect doesn't actually work
    throw redirect({
      to: '/dashboard/codes',
    })
  })

export const Route = createFileRoute('/dashboard/codes/new')({
  component: RouteComponent,
})

function RouteComponent() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await createQRCode({
        data: {
          url,
        },
      })
    } catch (err: any) {
      // Redirect throws an error, so we need to check if it's actually an error
      if (err?.message && !err?.message.includes('redirect')) {
        setError(err.message || 'Failed to create QR code')
        setLoading(false)
      }
      // If it's a redirect, let it propagate
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Create New QR Code</h2>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <label htmlFor="url" className="block text-sm font-medium mb-2">
            URL
          </label>
          <Input
            id="url"
            type="url"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            disabled={loading}
            className="w-full"
          />
        </div>
        {error && <div className="text-sm text-destructive">{error}</div>}
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create QR Code'}
        </Button>
      </form>
    </div>
  )
}
