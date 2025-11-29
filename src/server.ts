import handler, { createServerEntry } from '@tanstack/react-start/server-entry'

export default {
  ...createServerEntry({
    fetch(request) {
      return handler.fetch(request)
    },
  }),

  // Can add more cf worker handlers here if needed
}
