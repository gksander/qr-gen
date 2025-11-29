import {
  generateQRData,
  type QRErrorCorrectionLevel,
  type QRTypeNumber,
} from '@/lib/qr'
import { useEffect, useRef } from 'react'

type Props = {
  data: string
  typeNumber: QRTypeNumber
  errorCorrectionLevel: QRErrorCorrectionLevel
}

export function QRCodeCanvas({
  data,
  typeNumber,
  errorCorrectionLevel,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    try {
      const { dimension, getLocationType } = generateQRData({
        data,
        typeNumber,
        errorCorrectionLevel,
      })

      const margin = 2
      const scale = 10 // pixels per module
      const size = dimension * scale + margin * 2 * scale

      // Set canvas size
      canvas.width = size
      canvas.height = size

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Clear canvas with white background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, size, size)

      // Draw QR code modules
      for (let row = 0; row < dimension; row++) {
        for (let col = 0; col < dimension; col++) {
          const locationType = getLocationType({ x: col, y: row })
          if (locationType === 'empty') continue

          if (locationType === 'data') {
            ctx.fillStyle = '#000'
          }
          if (locationType === 'positionProbeOuter') {
            ctx.fillStyle = '#f00'
          }
          if (locationType === 'positionProbeInner') {
            ctx.fillStyle = '#00f'
          }
          if (locationType === 'alignmentPatternOuter') {
            ctx.fillStyle = '#0f0'
          }
          if (locationType === 'alignmentPatternInner') {
            ctx.fillStyle = '#f0f'
          }

          const x = col * scale + margin * scale
          const y = row * scale + margin * scale
          ctx.fillRect(x, y, scale, scale)
        }
      }
    } catch (err) {
      console.error('Error generating QR code:', err)
    }
  }, [data, typeNumber, errorCorrectionLevel])

  return (
    <canvas
      ref={canvasRef}
      className="border rounded-lg p-4 bg-white w-full aspect-square"
    />
  )
}
