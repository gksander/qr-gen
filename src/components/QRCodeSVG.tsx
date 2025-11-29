import {
  generateQRData,
  type QRErrorCorrectionLevel,
  type QRTypeNumber,
} from '@/lib/qr'
import { useMemo } from 'react'

type Props = {
  data: string
  typeNumber: QRTypeNumber
  errorCorrectionLevel: QRErrorCorrectionLevel
}

export function QRCodeSVG({ data, typeNumber, errorCorrectionLevel }: Props) {
  const { positionProbePath, alignmentPatternPath, dataPath, size } =
    useMemo(() => {
      try {
        const { dimension, getLocationType } = generateQRData({
          data,
          typeNumber,
          errorCorrectionLevel,
        })

        const cellSize = 2
        const margin = cellSize * 4
        const size = dimension * cellSize + margin * 2

        // Build separate SVG paths for position probes, alignment patterns, and data
        let positionProbePath = ''
        let alignmentPatternPath = ''
        let dataPath = ''

        for (let row = 0; row < dimension; row++) {
          const y = row * cellSize + margin
          for (let col = 0; col < dimension; col++) {
            const locationType = getLocationType({ x: col, y: row })
            if (locationType === 'empty') continue

            const x = col * cellSize + margin
            // M = move to, l = line relative
            // Draw a square: move to top-left, then draw right, down, left, up, close
            const squarePath = `M${x},${y} l${cellSize},0 0,${cellSize} -${cellSize},0 0,-${cellSize}z `

            // Separate position probes, alignment patterns, and data
            if (
              locationType === 'positionProbeOuter' ||
              locationType === 'positionProbeInner'
            ) {
              positionProbePath += squarePath
            } else if (
              locationType === 'alignmentPatternOuter' ||
              locationType === 'alignmentPatternInner'
            ) {
              alignmentPatternPath += squarePath
            } else {
              dataPath += squarePath
            }
          }
        }

        return { positionProbePath, alignmentPatternPath, dataPath, size }
      } catch (err) {
        console.error('Error generating QR code:', err)
        return {
          positionProbePath: '',
          alignmentPatternPath: '',
          dataPath: '',
          size: 0,
        }
      }
    }, [data, typeNumber, errorCorrectionLevel])

  if (!dataPath && !positionProbePath && !alignmentPatternPath) {
    return <div>Error generating QR code</div>
  }

  return (
    <svg
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${size} ${size}`}
      preserveAspectRatio="xMinYMin meet"
      className="border rounded-lg p-4 bg-white w-full aspect-square"
    >
      <rect width="100%" height="100%" fill="white" />
      {/* Draw data in black */}
      {dataPath && <path d={dataPath} stroke="transparent" fill="black" />}
      {/* Draw position probes in blue */}
      {positionProbePath && (
        <path d={positionProbePath} stroke="transparent" fill="#3b82f6" />
      )}
      {/* Draw alignment patterns in green */}
      {alignmentPatternPath && (
        <path d={alignmentPatternPath} stroke="transparent" fill="#10b981" />
      )}
    </svg>
  )
}
