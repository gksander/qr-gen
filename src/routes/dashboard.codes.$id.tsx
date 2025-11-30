import { createFileRoute, Link, notFound, Outlet } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { qrCodesTable } from '@/db/schema'
import { authMiddleware } from '@/middleware/authMiddleware'
import { eq, and } from 'drizzle-orm'
import { QRCodeSVG } from '@/components/QRCodeSVG'
import { z } from 'zod'

const getQRCode = createServerFn({
  method: 'GET',
})
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      id: z.string(),
    }),
  )
  .handler(async ({ data, context }) => {
    const userId = context.currentUserId

    if (!userId) {
      throw notFound()
    }

    const [code] = await db
      .select()
      .from(qrCodesTable)
      .where(and(eq(qrCodesTable.id, data.id), eq(qrCodesTable.userId, userId)))
      .limit(1)

    if (!code) {
      throw notFound()
    }

    return code
  })

export const Route = createFileRoute('/dashboard/codes/$id')({
  component: RouteComponent,

  beforeLoad: async ({ params }) => {
    const code = await getQRCode({
      data: { id: params.id },
    })

    return { code, title: code.title }
  },

  loader: async ({ context }) => {
    return { code: context.code }
  },
})

function RouteComponent() {
  const { code } = Route.useLoaderData()

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{code.title}</h2>
      <Outlet />
    </div>
  )
}
