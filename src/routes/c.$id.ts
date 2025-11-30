import { db } from '@/db'
import { qrCodesTable } from '@/db/schema'
import { createFileRoute } from '@tanstack/react-router'
import { eq } from 'drizzle-orm'

export const Route = createFileRoute('/c/$id')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const code = await db.query.qrCodesTable.findFirst({
          where: eq(qrCodesTable.id, params.id),
        })

        // TODO: better error handling
        if (!code) {
          return new Response(JSON.stringify({ error: 'Code not found' }), {
            status: 404,
          })
        }

        // TODO: better error handling
        if (code.type !== 'url') {
          return new Response(JSON.stringify({ error: 'Code is not a URL' }), {
            status: 400,
          })
        }

        return Response.redirect(code.data, 307)
      },
    },
  },
})
