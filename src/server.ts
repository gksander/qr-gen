import handler, { createServerEntry } from '@tanstack/react-start/server-entry'

export default {
  ...createServerEntry({
    fetch(request, env?: any) {
      // Store the environment in the request for access in server functions
      if (env) {
        ;(request as any).env = env
      }
      return handler.fetch(request)
    },
  }),

  // Can add more cf worker handlers here if needed
}
