import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { db } from '@/db'
import { user } from '@/db/schema'
import { auth } from '@/lib/auth'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const doesAdminExist = createServerFn({
  method: 'GET',
}).handler(async () => {
  const adminUser = await db.query.user.findFirst({
    where: (user, { eq }) => eq(user.role, 'admin'),
  })

  return !!adminUser
})

const signUpAdmin = createServerFn({
  method: 'POST',
})
  .inputValidator(
    z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const adminExists = await doesAdminExist()

    if (adminExists) {
      throw redirect({
        to: '/',
      })
    }

    // Use Better Auth API to sign up the admin user
    const result = await auth.api.signUpEmail({
      body: {
        email: data.email,
        password: data.password,
        name: data.name,
      },
    })

    // Set the role
    await db
      .update(user)
      .set({ role: 'admin' })
      .where(eq(user.id, result.user.id))

    throw redirect({
      to: '/',
    })
  })

export const Route = createFileRoute('/seed')({
  component: SeedPage,
  loader: async () => {
    const adminExists = await doesAdminExist()

    if (adminExists) {
      throw redirect({
        to: '/',
      })
    }

    return { adminExists: false }
  },
})

// This is AI slop, but API call works.
function SeedPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await signUpAdmin({
        data: {
          email,
          password,
          name,
        },
      })
      setSuccess(true)
    } catch (err: any) {
      setError(err?.message || 'Failed to create admin user')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-zinc-800 to-black p-4 text-white">
        <div className="w-full max-w-md p-8 rounded-xl backdrop-blur-md bg-black/50 shadow-xl border-8 border-black/10">
          <h1 className="text-2xl mb-4 text-green-400">Success!</h1>
          <p className="text-white/80">
            Admin user created successfully. You can now log in.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-zinc-800 to-black p-4 text-white">
      <div className="w-full max-w-md p-8 rounded-xl backdrop-blur-md bg-black/50 shadow-xl border-8 border-black/10">
        <h1 className="text-2xl mb-4">Create Initial Admin User</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium mb-2 text-white/80"
            >
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              placeholder="Admin Name"
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium mb-2 text-white/80"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-2 text-white/80"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              placeholder="Password (min 8 characters)"
            />
          </div>
          {error && (
            <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg p-3">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading || !email || !password || !name}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            {loading ? 'Creating...' : 'Create Admin User'}
          </button>
        </form>
      </div>
    </div>
  )
}
