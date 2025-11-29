import {
  generateQRData,
  type QRErrorCorrectionLevel,
  type QRTypeNumber,
} from '@/lib/qr'
import { useMemo, useRef, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

type Props = {
  data: string
  typeNumber: QRTypeNumber
  errorCorrectionLevel: QRErrorCorrectionLevel
  logoColor?: string
}

export function QRCodeSVG({
  data,
  typeNumber,
  errorCorrectionLevel,
  logoColor = '#000000',
}: Props) {
  const [logoContent, setLogoContent] = useState<string>('')

  useEffect(() => {
    // Fetch and parse the logo SVG
    fetch('/ramp-logo.svg')
      .then((res) => res.text())
      .then((text) => {
        // Parse the SVG and modify paths to use the logo color
        const parser = new DOMParser()
        const svgDoc = parser.parseFromString(text, 'image/svg+xml')
        const svgElement = svgDoc.documentElement

        // Find all path elements and set their fill to the logo color
        const paths = svgElement.querySelectorAll('path')
        paths.forEach((path) => {
          path.setAttribute('fill', logoColor)
        })

        // Get the inner content (everything inside the root <svg> tag)
        setLogoContent(svgElement.innerHTML)
      })
      .catch((err) => {
        console.warn('Failed to load logo:', err)
      })
  }, [logoColor])
  const { positionProbePath, alignmentPatternPath, dataPath, size, logoArea } =
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

        // Logo dimensions and positioning
        // Logo viewBox is "0 0 281.9 75", so aspect ratio is ~3.76:1
        const logoAspectRatio = 281.9 / 75
        // Calculate logo size to fit nicely in the center (about 20% of QR code size)
        const logoMaxWidth = size * 0.2
        const logoWidth = logoMaxWidth
        const logoHeight = logoWidth / logoAspectRatio
        const logoX = (size - logoWidth) / 2
        const logoY = (size - logoHeight) / 2

        // Logo area in cell coordinates (for collision detection)
        const logoAreaStartCol = Math.floor((logoX - margin) / cellSize)
        const logoAreaEndCol = Math.ceil(
          (logoX + logoWidth - margin) / cellSize,
        )
        const logoAreaStartRow = Math.floor((logoY - margin) / cellSize)
        const logoAreaEndRow = Math.ceil(
          (logoY + logoHeight - margin) / cellSize,
        )

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
              // Skip data cells that would overlap with the logo area
              const isInLogoArea =
                col >= logoAreaStartCol &&
                col < logoAreaEndCol &&
                row >= logoAreaStartRow &&
                row < logoAreaEndRow

              if (!isInLogoArea) {
                dataPath += squarePath
              }
            }
          }
        }

        return {
          positionProbePath,
          alignmentPatternPath,
          dataPath,
          size,
          logoArea: {
            x: logoX,
            y: logoY,
            width: logoWidth,
            height: logoHeight,
          },
        }
      } catch (err) {
        console.error('Error generating QR code:', err)
        return {
          positionProbePath: '',
          alignmentPatternPath: '',
          dataPath: '',
          size: 0,
          logoArea: { x: 0, y: 0, width: 0, height: 0 },
        }
      }
    }, [data, typeNumber, errorCorrectionLevel])

  const svgRef = useRef<SVGSVGElement>(null)

  const handleDownload = async () => {
    if (!svgRef.current) return

    try {
      // Clone the SVG element
      const svgClone = svgRef.current.cloneNode(true) as SVGSVGElement

      // The logo is already inlined, so we just need to ensure the color is preserved
      // The cloned SVG will already have the correct fill color applied

      // Get the SVG string
      const serializer = new XMLSerializer()
      const svgString = serializer.serializeToString(svgClone)

      // Create blob and download
      const blob = new Blob([svgString], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'qrcode.svg'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error downloading SVG:', err)
    }
  }

  if (!dataPath && !positionProbePath && !alignmentPatternPath) {
    return <div>Error generating QR code</div>
  }

  return (
    <div className="flex flex-col gap-4">
      <svg
        ref={svgRef}
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
        {/* Embed logo in center */}
        {logoArea.width > 0 && logoArea.height > 0 && logoContent && (
          <g
            transform={`translate(${logoArea.x}, ${logoArea.y}) scale(${
              logoArea.width / 281.9
            })`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 281.9 75"
              width="281.9"
              height="75"
            >
              <g dangerouslySetInnerHTML={{ __html: logoContent }} />
            </svg>
          </g>
        )}
      </svg>
      <Button onClick={handleDownload} variant="outline" className="w-full">
        <Download className="size-4" />
        Download SVG
      </Button>
    </div>
  )
}
