import { QRCodeCanvas } from '@/components/QRCodeCanvas'
import { QRCodeSVG } from '@/components/QRCodeSVG'
import { Input } from '@/components/ui/input'
import { postsTable } from '@/db/schema'
import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { env } from 'cloudflare:workers'
import { drizzle } from 'drizzle-orm/d1'
import { useDeferredValue, useState } from 'react'

const getPosts = createServerFn({
  method: 'GET',
}).handler(async () => {
  try {
    const db = drizzle(env.DB)
    const posts = await db.select().from(postsTable).limit(10)
    console.log(posts)
    return posts
  } catch (error) {
    return []
  }
})

export const Route = createFileRoute('/')({
  component: App,
  loader: async () => {
    try {
      return await getPosts()
    } catch (error) {
      return []
    }
  },
})

function App() {
  const [url, setUrl] = useState('https://gksander.com')
  const [level, setLevel] = useState<TypeNumber>(3)
  const posts = Route.useLoaderData()

  const deferredUrl = useDeferredValue(url)
  const deferredLevel = useDeferredValue(level)

  console.log(posts)

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-8">
      <div className="w-full max-w-3xl space-y-4">
        <h1 className="text-3xl font-bold text-center">QR Code Generator</h1>
        {posts && posts.length > 0 && (
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Posts from Database:</h2>
            <ul className="space-y-2">
              {posts.map((post: any) => (
                <li key={post.id} className="border-b pb-2">
                  <h3 className="font-medium">{post.title}</h3>
                  {post.content && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {post.content}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Published: {post.published ? 'Yes' : 'No'}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
        <Input
          type="url"
          placeholder="Enter a web URL..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full"
        />
        <Input
          type="number"
          placeholder="Enter the level"
          value={level}
          onChange={(e) => setLevel(Number(e.target.value) as TypeNumber)}
          min={0}
          max={40}
          className="w-full"
        />
        {url && (
          <div className="flex justify-center">
            <div className="flex-1">
              <QRCodeCanvas
                data={deferredUrl}
                typeNumber={deferredLevel}
                errorCorrectionLevel="M"
              />
            </div>
            <div className="flex-1">
              <QRCodeSVG
                data={deferredUrl}
                typeNumber={deferredLevel}
                errorCorrectionLevel="M"
                logoColor="#ff0000"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
