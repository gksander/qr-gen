import { createFileRoute, Link, notFound } from '@tanstack/react-router'
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
    const session = context.session

    if (!session?.user?.id) {
      throw notFound()
    }

    const [code] = await db
      .select()
      .from(qrCodesTable)
      .where(
        and(
          eq(qrCodesTable.id, data.id),
          eq(qrCodesTable.userId, session.user.id),
        ),
      )
      .limit(1)

    if (!code) {
      throw notFound()
    }

    return code
  })

export const Route = createFileRoute('/dashboard/codes/$id')({
  component: RouteComponent,
  loader: async ({ context, params }) => {
    return await getQRCode({
      data: { id: params.id },
      context,
    })
  },
})

function RouteComponent() {
  const code = Route.useLoaderData()

  return (
    <div>
      <div className="mb-4">
        <Link
          to="/dashboard/codes"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to QR Codes
        </Link>
      </div>
      <h2 className="text-2xl font-bold mb-4">QR Code Details</h2>
      <div className="space-y-4">
        <div>
          <div className="text-sm font-medium text-muted-foreground">ID</div>
          <div className="text-sm font-mono">{code.id}</div>
        </div>
        <div>
          <div className="text-sm font-medium text-muted-foreground">Type</div>
          <div className="text-sm">{code.type}</div>
        </div>
        <div>
          <div className="text-sm font-medium text-muted-foreground">Data</div>
          <div className="text-sm break-all">{code.data}</div>
        </div>
        <div>
          <div className="text-sm font-medium text-muted-foreground">Created</div>
          <div className="text-sm">
            {code.createdAt
              ? new Date(code.createdAt).toLocaleString()
              : 'Unknown date'}
          </div>
        </div>
        <div>
          <div className="text-sm font-medium text-muted-foreground mb-2">
            QR Code
          </div>
          <div className="flex justify-center p-4 bg-white rounded-lg">
            <QRCodeSVG
              data={code.data}
              typeNumber={3}
              errorCorrectionLevel="M"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

