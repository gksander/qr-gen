import { authMiddleware } from '@/middleware/authMiddleware'
import { createServerFn } from '@tanstack/react-start'

export const getUser = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const session = context.session
    const isAdmin = session?.user?.role === 'admin'

    return {
      session,
      isAdmin,
    }
  })
