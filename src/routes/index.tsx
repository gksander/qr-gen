import { QRCodeCanvas } from '@/components/QRCodeCanvas'
import { QRCodeSVG } from '@/components/QRCodeSVG'
import { Input } from '@/components/ui/input'
import { createFileRoute } from '@tanstack/react-router'
import { useDeferredValue, useState } from 'react'

export const Route = createFileRoute('/')({ component: App })

function App() {
  const [url, setUrl] = useState('https://gksander.com')
  const [level, setLevel] = useState<TypeNumber>(0)

  const deferredUrl = useDeferredValue(url)
  const deferredLevel = useDeferredValue(level)

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-8">
      <div className="w-full max-w-3xl space-y-4">
        <h1 className="text-3xl font-bold text-center">QR Code Generator</h1>
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
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
