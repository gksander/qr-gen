import { generateQRData } from '@/lib/qr'
import { useMemo } from 'react'

export type ControlType = 'color' | 'text'

export type ControlConfig<TValue> = {
  type: ControlType
  label: string
  defaultValue: TValue
}

export type TemplateBase<
  TControls extends Record<string, ControlConfig<unknown>>,
> = {
  title: string
  controls: TControls
  Component: (args: {
    data: string
    controlValues: { [K in keyof TControls]: TControls[K]['defaultValue'] }
  }) => React.ReactNode
}

function createTemplate<
  TControls extends Record<string, ControlConfig<unknown>>,
>(template: TemplateBase<TControls>) {
  return template
}

const standardTemplate = createTemplate({
  title: 'Standard',
  controls: {
    backgroundColor: {
      type: 'color',
      label: 'Background Color',
      defaultValue: '#000000',
    },
    text: {
      type: 'text',
      label: 'Text',
      defaultValue: 'Hello, world!',
    },
  },
  Component: ({ data, controlValues }) => {
    const bg = controlValues.backgroundColor
    const text = controlValues.text

    const { positionProbePath, alignmentPatternPath, dataPath, size } =
      useMemo(() => {
        try {
          const { dimension, getLocationType } = generateQRData({
            data,
            typeNumber: 3,
            errorCorrectionLevel: 'M',
          })

          const cellSize = 2
          const margin = cellSize * 4
          const size = dimension * cellSize + margin * 2

          // Logo dimensions and positioning
          // Logo viewBox is "0 0 281.9 75", so aspect ratio is ~3.76:1
          const logoAspectRatio = 1
          // Calculate logo size to fit nicely in the center (about 20% of QR code size)
          const logoMaxWidth = size * 0.1
          const logoWidth = logoMaxWidth
          const logoHeight = logoWidth / logoAspectRatio
          const logoX = (size - logoWidth) / 2
          const logoY = (size - logoHeight) / 2

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
          return {
            positionProbePath: '',
            alignmentPatternPath: '',
            dataPath: '',
            size: 0,
            logoArea: { x: 0, y: 0, width: 0, height: 0 },
          }
        }
      }, [data])

    return (
      <svg
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${size} ${size}`}
        preserveAspectRatio="xMinYMin meet"
        className="border rounded-lg p-4 bg-white w-full aspect-square"
      >
        {dataPath && <path d={dataPath} stroke="transparent" fill={bg} />}
        {positionProbePath && (
          <path d={positionProbePath} stroke="transparent" fill="#3b82f6" />
        )}
        {alignmentPatternPath && (
          <path d={alignmentPatternPath} stroke="transparent" fill="#10b981" />
        )}
        {text && (
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#f00"
            fontSize={8}
            fontWeight="bold"
          >
            {text}
          </text>
        )}
      </svg>
    )
  },
})

const basicCircleTemplate = createTemplate({
  title: 'Basic Circle',
  controls: {},
  Component: ({ data }) => {
    const {
      positionProbePath,
      alignmentPatternPath,
      dataPath,
      size,
      circleRadius,
      circleCenter,
      cornerFillPath,
    } = useMemo(() => {
      try {
        const { dimension, getLocationType } = generateQRData({
          data,
          typeNumber: 3,
          errorCorrectionLevel: 'M',
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

        // Calculate circle that fits the square diagonally
        const circleCenter = size / 2
        // Radius to fit square diagonally: sqrt(2) * size / 2
        const circleRadius = (size * Math.sqrt(2)) / 2

        // Fill in corners outside the square but inside the circle
        // We'll add small cells in the corner regions
        let cornerFillPath = ''
        const cornerCellSize = cellSize
        const cornerMargin = 1 // Small margin from the square edge

        // Check points in a grid that covers the area outside the square but inside the circle
        for (let y = 0; y < size; y += cornerCellSize) {
          for (let x = 0; x < size; x += cornerCellSize) {
            // Check if point is inside the circle
            const dx = x - circleCenter
            const dy = y - circleCenter
            const distanceFromCenter = Math.sqrt(dx * dx + dy * dy)

            if (distanceFromCenter <= circleRadius) {
              // Check if point is outside the square (with margin)
              const isOutsideSquare =
                x < margin - cornerMargin ||
                x >= size - margin + cornerMargin ||
                y < margin - cornerMargin ||
                y >= size - margin + cornerMargin

              if (isOutsideSquare) {
                // Add a small cell here
                const cornerPath = `M${x},${y} l${cornerCellSize},0 0,${cornerCellSize} -${cornerCellSize},0 0,-${cornerCellSize}z `
                cornerFillPath += cornerPath
              }
            }
          }
        }

        return {
          positionProbePath,
          alignmentPatternPath,
          dataPath,
          size,
          circleRadius,
          circleCenter,
          cornerFillPath,
        }
      } catch (err) {
        console.error('Error generating QR code:', err)
        return {
          positionProbePath: '',
          alignmentPatternPath: '',
          dataPath: '',
          size: 0,
          circleRadius: 0,
          circleCenter: 0,
          cornerFillPath: '',
        }
      }
    }, [data])

    return (
      <svg
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${size} ${size}`}
        preserveAspectRatio="xMinYMin meet"
        className="border rounded-lg p-4 bg-white w-full aspect-square"
      >
        <defs>
          <clipPath id="circleClip">
            <circle cx={circleCenter} cy={circleCenter} r={circleRadius} />
          </clipPath>
        </defs>
        <g clipPath="url(#circleClip)">
          {/* Background */}
          <rect width="100%" height="100%" fill="white" />
          {/* Corner fill data */}
          {cornerFillPath && (
            <path d={cornerFillPath} stroke="transparent" fill="black" />
          )}
          {/* QR code data */}
          {dataPath && <path d={dataPath} stroke="transparent" fill="black" />}
          {positionProbePath && (
            <path d={positionProbePath} stroke="transparent" fill="#3b82f6" />
          )}
          {alignmentPatternPath && (
            <path
              d={alignmentPatternPath}
              stroke="transparent"
              fill="#10b981"
            />
          )}
        </g>
        {/* Black border around the circle */}
        <circle
          cx={circleCenter}
          cy={circleCenter}
          r={circleRadius}
          fill="none"
          stroke="black"
          strokeWidth="2"
        />
      </svg>
    )
  },
})

export const TEMPLATES = {
  standard: standardTemplate,
  basicCircle: basicCircleTemplate,
}

export type TemplateType = keyof typeof TEMPLATES

// export type TemplateBase = z.ZodType<{
//   type: string
//   title: string
//   // TODO: render
// }>

// const templateSchema = z.discriminatedUnion('type', [
//   standardTemplateSchema,
//   circleBasicTemplateSchema,
// ])
