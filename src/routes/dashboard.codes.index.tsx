import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { qrCodesTable } from '@/db/schema'
import { authMiddleware } from '@/middleware/authMiddleware'
import { eq, desc } from 'drizzle-orm'

const getQRCodes = createServerFn({
  method: 'GET',
})
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const currentUserId = context.currentUserId

    if (!currentUserId) {
      return []
    }

    return db.query.qrCodesTable.findMany({
      where: eq(qrCodesTable.userId, currentUserId),
      orderBy: desc(qrCodesTable.createdAt),
    })
  })

export const Route = createFileRoute('/dashboard/codes/')({
  component: RouteComponent,
  loader: async () => {
    return await getQRCodes()
  },
})

function RouteComponent() {
  const codes = Route.useLoaderData()

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Existing QR Codes</h2>
      {codes.length === 0 ? (
        <p className="text-muted-foreground">
          No QR codes yet. Create your first one!
        </p>
      ) : (
        <div className="space-y-2">
          {codes.map((code) => (
            <Link
              key={code.id}
              to="/dashboard/codes/$id"
              params={{ id: code.id }}
              className="block p-4 border rounded-lg hover:bg-accent transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{code.type}</div>
                  <div className="text-sm text-muted-foreground truncate max-w-md">
                    {code.data}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {code.createdAt
                    ? new Date(code.createdAt).toLocaleDateString()
                    : 'Unknown date'}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
