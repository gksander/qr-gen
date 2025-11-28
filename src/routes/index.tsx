import { createFileRoute } from '@tanstack/react-router'
import { useState, useRef, useEffect } from 'react'
import qrcode from 'qrcode-generator'
import { Input } from '@/components/ui/input'
import { generateQRData, getQRMetadata } from '@/lib/qr'

export const Route = createFileRoute('/')({ component: App })

function App() {
  const [url, setUrl] = useState('https://gksander.com')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [level, setLevel] = useState<TypeNumber>(0)

  useEffect(() => {
    if (url && canvasRef.current) {
      try {
        console.log(getQRMetadata({ data: url, errorCorrectionLevel: 'M' }))

        const { dimension, isFilled, isInFinderPattern } = generateQRData({
          data: url,
          typeNumber: level,
          errorCorrectionLevel: 'L',
        })

        console.log(dimension)

        // // Generate QR code data
        // const qr = qrcode(level, 'M') // Error correction level M (Medium)
        // qr.addData(url)
        // qr.make()

        // // Get the module count (QR code size)
        // const moduleCount = qr.getModuleCount()
        const margin = 2
        const scale = 10 // pixels per module
        const size = dimension * scale + margin * 2 * scale

        // Set canvas size
        const canvas = canvasRef.current
        canvas.width = size
        canvas.height = size

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Clear canvas with white background
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, size, size)

        // Draw QR code modules
        ctx.fillStyle = '#000000'
        for (let row = 0; row < dimension; row++) {
          for (let col = 0; col < dimension; col++) {
            if (isFilled({ x: col, y: row })) {
              const x = col * scale + margin * scale
              const y = row * scale + margin * scale
              ctx.fillRect(x, y, scale, scale)
            }
          }
        }
      } catch (err) {
        console.error('Error generating QR code:', err)
      }
    }
  }, [url, level])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-8">
      <div className="w-full max-w-md space-y-4">
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
            <canvas
              ref={canvasRef}
              className="border rounded-lg p-4 bg-white w-100 h-100"
            />
          </div>
        )}
      </div>
    </div>
  )
}
