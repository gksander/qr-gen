import { auth } from '@/lib/auth'
import { createMiddleware } from '@tanstack/react-start'

export const authMiddleware = createMiddleware().server(
  async ({ next, request }) => {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    const currentUserId = session?.user?.id

    return next({
      context: { session, currentUserId },
    })
  },
)
