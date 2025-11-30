import { db } from '@/db'
import { qrCodesTable } from '@/db/schema'
import { createFileRoute } from '@tanstack/react-router'
import { env } from 'cloudflare:workers'
import { eq } from 'drizzle-orm'

export const Route = createFileRoute('/c/$id')({
  server: {
    handlers: {
      /**
       * TODO: log to analytics. Proably only log to analytics if redirect hit
       */
      GET: async ({ params }) => {
        // Check the cache
        const storedUrl = await env.KV.get(params.id)
        if (storedUrl) {
          return Response.redirect(storedUrl, 307)
        }

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

        // Stash in cache
        await env.KV.put(params.id, code.data)

        return Response.redirect(code.data, 307)
      },
    },
  },
})
