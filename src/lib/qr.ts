type QRMetadata = {
  minTypeNumber: QRTypeNumber
}

// QR Mode constants
const QRMode = {
  MODE_NUMBER: 1 << 0,
  MODE_ALPHA_NUM: 1 << 1,
  MODE_8BIT_BYTE: 1 << 2,
  MODE_KANJI: 1 << 3,
} as const

// Error correction level mapping
const QRErrorCorrectionLevelMap: Record<QRErrorCorrectionLevel, number> = {
  L: 1,
  M: 0,
  Q: 3,
  H: 2,
}

// Mask pattern constants
const QRMaskPattern = {
  PATTERN000: 0,
  PATTERN001: 1,
  PATTERN010: 2,
  PATTERN011: 3,
  PATTERN100: 4,
  PATTERN101: 5,
  PATTERN110: 6,
  PATTERN111: 7,
} as const

type RSBlock = {
  totalCount: number
  dataCount: number
}

// Utility: Convert string to bytes using Latin-1 encoding (default for qrcode-generator)
function stringToBytes(s: string): number[] {
  const bytes: number[] = []
  for (let i = 0; i < s.length; i++) {
    const charcode = s.charCodeAt(i)
    bytes.push(charcode & 0xff)
  }
  return bytes
}

// Get length in bits for mode indicator
function getLengthInBits(mode: number, type: number): number {
  if (1 <= type && type < 10) {
    switch (mode) {
      case QRMode.MODE_8BIT_BYTE:
        return 8
      default:
        throw new Error(`mode:${mode}`)
    }
  } else if (type < 27) {
    switch (mode) {
      case QRMode.MODE_8BIT_BYTE:
        return 16
      default:
        throw new Error(`mode:${mode}`)
    }
  } else if (type < 41) {
    switch (mode) {
      case QRMode.MODE_8BIT_BYTE:
        return 16
      default:
        throw new Error(`mode:${mode}`)
    }
  } else {
    throw new Error(`type:${type}`)
  }
}

// Get RS blocks for type number and error correction level
function getRSBlocks(
  typeNumber: number,
  errorCorrectionLevel: QRErrorCorrectionLevel,
): RSBlock[] {
  // Map error correction level to RS block table index
  // L (value 1) -> index 0, M (value 0) -> index 1, Q (value 3) -> index 2, H (value 2) -> index 3
  const errorLevel = QRErrorCorrectionLevelMap[errorCorrectionLevel]
  let rsBlockIndex: number
  switch (errorLevel) {
    case 1: // L
      rsBlockIndex = (typeNumber - 1) * 4 + 0
      break
    case 0: // M
      rsBlockIndex = (typeNumber - 1) * 4 + 1
      break
    case 3: // Q
      rsBlockIndex = (typeNumber - 1) * 4 + 2
      break
    case 2: // H
      rsBlockIndex = (typeNumber - 1) * 4 + 3
      break
    default:
      throw new Error(`Invalid error correction level: ${errorCorrectionLevel}`)
  }
  const rsBlock = RS_BLOCK_TABLE[rsBlockIndex]

  if (!rsBlock) {
    throw new Error(
      `bad rs block @ typeNumber:${typeNumber}/errorCorrectionLevel:${errorCorrectionLevel}`,
    )
  }

  const length = rsBlock.length / 3
  const list: RSBlock[] = []

  for (let i = 0; i < length; i++) {
    const count = rsBlock[i * 3 + 0]
    const totalCount = rsBlock[i * 3 + 1]
    const dataCount = rsBlock[i * 3 + 2]

    for (let j = 0; j < count; j++) {
      list.push({ totalCount, dataCount })
    }
  }

  return list
}

// Get data capacity in bytes
function getDataCapacity(
  typeNumber: number,
  errorCorrectionLevel: QRErrorCorrectionLevel,
): number {
  const rsBlocks = getRSBlocks(typeNumber, errorCorrectionLevel)
  let totalDataCount = 0
  for (let i = 0; i < rsBlocks.length; i++) {
    totalDataCount += rsBlocks[i].dataCount
  }
  return totalDataCount
}

// Create error correction bytes
function createErrorCorrectionBytes(
  dataBytes: number[],
  rsBlocks: RSBlock[],
): number[] {
  const dcdata: number[][] = []
  const ecdata: number[][] = []
  let offset = 0

  let maxDcCount = 0
  let maxEcCount = 0

  for (let r = 0; r < rsBlocks.length; r++) {
    const dcCount = rsBlocks[r].dataCount
    const ecCount = rsBlocks[r].totalCount - dcCount

    maxDcCount = Math.max(maxDcCount, dcCount)
    maxEcCount = Math.max(maxEcCount, ecCount)

    dcdata[r] = new Array(dcCount)
    for (let i = 0; i < dcdata[r].length; i++) {
      if (i + offset >= dataBytes.length) {
        throw new Error(
          `Buffer overflow: trying to read byte ${i + offset} but buffer has only ${dataBytes.length} bytes`,
        )
      }
      dcdata[r][i] = 0xff & dataBytes[i + offset]
    }
    offset += dcCount

    const rsPoly = getErrorCorrectPolynomial(ecCount)
    const rawPoly = new QRPolynomial(dcdata[r], rsPoly.getLength() - 1)
    const modPoly = rawPoly.mod(rsPoly)

    ecdata[r] = new Array(rsPoly.getLength() - 1)
    for (let i = 0; i < ecdata[r].length; i++) {
      const modIndex = i + modPoly.getLength() - ecdata[r].length
      ecdata[r][i] = modIndex >= 0 ? modPoly.getAt(modIndex) : 0
    }
  }

  const totalCodeCount = rsBlocks.reduce(
    (sum, block) => sum + block.totalCount,
    0,
  )

  const data = new Array(totalCodeCount)
  let index = 0

  for (let i = 0; i < maxDcCount; i++) {
    for (let r = 0; r < rsBlocks.length; r++) {
      if (i < dcdata[r].length) {
        data[index] = dcdata[r][i]
        index++
      }
    }
  }

  for (let i = 0; i < maxEcCount; i++) {
    for (let r = 0; r < rsBlocks.length; r++) {
      if (i < ecdata[r].length) {
        data[index] = ecdata[r][i]
        index++
      }
    }
  }

  return data
}

// Get error correction polynomial
function getErrorCorrectPolynomial(errorCorrectLength: number): QRPolynomial {
  let a = new QRPolynomial([1], 0)
  for (let i = 0; i < errorCorrectLength; i++) {
    a = a.multiply(new QRPolynomial([1, QRMath.gexp(i)], 0))
  }
  return a
}

// BCH encoding for type info
const G15 =
  (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0)
const G15_MASK = (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1)

function getBCHDigit(data: number): number {
  let digit = 0
  while (data !== 0) {
    digit++
    data >>>= 1
  }
  return digit
}

function getBCHTypeInfo(data: number): number {
  let d = data << 10
  while (getBCHDigit(d) - getBCHDigit(G15) >= 0) {
    d ^= G15 << (getBCHDigit(d) - getBCHDigit(G15))
  }
  return ((data << 10) | d) ^ G15_MASK
}

// BCH encoding for type number
const G18 =
  (1 << 12) |
  (1 << 11) |
  (1 << 10) |
  (1 << 9) |
  (1 << 8) |
  (1 << 5) |
  (1 << 2) |
  (1 << 0)

function getBCHTypeNumber(data: number): number {
  let d = data << 12
  while (getBCHDigit(d) - getBCHDigit(G18) >= 0) {
    d ^= G18 << (getBCHDigit(d) - getBCHDigit(G18))
  }
  return (data << 12) | d
}

// Get pattern position for alignment patterns
function getPatternPosition(typeNumber: number): number[] {
  return PATTERN_POSITION_TABLE[typeNumber - 1] || []
}

// Get mask function
function getMaskFunction(
  maskPattern: number,
): (i: number, j: number) => boolean {
  switch (maskPattern) {
    case QRMaskPattern.PATTERN000:
      return (i, j) => (i + j) % 2 === 0
    case QRMaskPattern.PATTERN001:
      return (i, _j) => i % 2 === 0
    case QRMaskPattern.PATTERN010:
      return (_i, j) => j % 3 === 0
    case QRMaskPattern.PATTERN011:
      return (i, j) => (i + j) % 3 === 0
    case QRMaskPattern.PATTERN100:
      return (i, j) => (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0
    case QRMaskPattern.PATTERN101:
      return (i, j) => ((i * j) % 2) + ((i * j) % 3) === 0
    case QRMaskPattern.PATTERN110:
      return (i, j) => (((i * j) % 2) + ((i * j) % 3)) % 2 === 0
    case QRMaskPattern.PATTERN111:
      return (i, j) => (((i * j) % 3) + ((i + j) % 2)) % 2 === 0
    default:
      throw new Error(`bad maskPattern:${maskPattern}`)
  }
}

// Setup position probe pattern (finder pattern)
function setupPositionProbePattern(
  modules: (boolean | null)[][],
  row: number,
  col: number,
  moduleCount: number,
): void {
  for (let r = -1; r <= 7; r++) {
    if (row + r <= -1 || moduleCount <= row + r) continue

    for (let c = -1; c <= 7; c++) {
      if (col + c <= -1 || moduleCount <= col + c) continue

      if (
        (0 <= r && r <= 6 && (c === 0 || c === 6)) ||
        (0 <= c && c <= 6 && (r === 0 || r === 6)) ||
        (2 <= r && r <= 4 && 2 <= c && c <= 4)
      ) {
        modules[row + r][col + c] = true
      } else {
        modules[row + r][col + c] = false
      }
    }
  }
}

// Setup timing pattern
function setupTimingPattern(
  modules: (boolean | null)[][],
  moduleCount: number,
): void {
  for (let r = 8; r < moduleCount - 8; r++) {
    if (modules[r][6] != null) {
      continue
    }
    modules[r][6] = r % 2 === 0
  }

  for (let c = 8; c < moduleCount - 8; c++) {
    if (modules[6][c] != null) {
      continue
    }
    modules[6][c] = c % 2 === 0
  }
}

// Setup position adjust pattern
function setupPositionAdjustPattern(
  modules: (boolean | null)[][],
  _moduleCount: number,
  typeNumber: number,
): void {
  const pos = getPatternPosition(typeNumber)

  for (let i = 0; i < pos.length; i++) {
    for (let j = 0; j < pos.length; j++) {
      const row = pos[i]
      const col = pos[j]

      if (modules[row][col] != null) {
        continue
      }

      for (let r = -2; r <= 2; r++) {
        for (let c = -2; c <= 2; c++) {
          if (
            r === -2 ||
            r === 2 ||
            c === -2 ||
            c === 2 ||
            (r === 0 && c === 0)
          ) {
            modules[row + r][col + c] = true
          } else {
            modules[row + r][col + c] = false
          }
        }
      }
    }
  }
}

// Setup type number
function setupTypeNumber(
  modules: (boolean | null)[][],
  moduleCount: number,
  typeNumber: number,
  test: boolean,
): void {
  const bits = getBCHTypeNumber(typeNumber)

  for (let i = 0; i < 18; i++) {
    const mod = !test && ((bits >> i) & 1) === 1
    modules[Math.floor(i / 3)][(i % 3) + moduleCount - 8 - 3] = mod
  }

  for (let i = 0; i < 18; i++) {
    const mod = !test && ((bits >> i) & 1) === 1
    modules[(i % 3) + moduleCount - 8 - 3][Math.floor(i / 3)] = mod
  }
}

// Setup type info
function setupTypeInfo(
  modules: (boolean | null)[][],
  moduleCount: number,
  errorCorrectionLevel: QRErrorCorrectionLevel,
  maskPattern: number,
  test: boolean,
): void {
  const errorLevel = QRErrorCorrectionLevelMap[errorCorrectionLevel]
  const data = (errorLevel << 3) | maskPattern
  const bits = getBCHTypeInfo(data)

  // vertical
  for (let i = 0; i < 15; i++) {
    const mod = !test && ((bits >> i) & 1) === 1

    if (i < 6) {
      modules[i][8] = mod
    } else if (i < 8) {
      modules[i + 1][8] = mod
    } else {
      modules[moduleCount - 15 + i][8] = mod
    }
  }

  // horizontal
  for (let i = 0; i < 15; i++) {
    const mod = !test && ((bits >> i) & 1) === 1

    if (i < 8) {
      modules[8][moduleCount - i - 1] = mod
    } else if (i < 9) {
      modules[8][15 - i - 1 + 1] = mod
    } else {
      modules[8][15 - i - 1] = mod
    }
  }

  // fixed module
  modules[moduleCount - 8][8] = !test
}

// Map data into matrix
function mapData(
  modules: (boolean | null)[][],
  moduleCount: number,
  data: number[],
  maskPattern: number,
): void {
  let inc = -1
  let row = moduleCount - 1
  let bitIndex = 7
  let byteIndex = 0
  const maskFunc = getMaskFunction(maskPattern)

  for (let col = moduleCount - 1; col > 0; col -= 2) {
    if (col === 6) col -= 1

    while (true) {
      for (let c = 0; c < 2; c++) {
        if (modules[row][col - c] == null) {
          let dark = false

          if (byteIndex < data.length) {
            dark = ((data[byteIndex] >>> bitIndex) & 1) === 1
          }

          const mask = maskFunc(row, col - c)

          if (mask) {
            dark = !dark
          }

          modules[row][col - c] = dark
          bitIndex -= 1

          if (bitIndex === -1) {
            byteIndex += 1
            bitIndex = 7
          }
        }
      }

      row += inc

      if (row < 0 || moduleCount <= row) {
        row -= inc
        inc = -inc
        break
      }
    }
  }
}

// Calculate lost point (penalty score)
function getLostPoint(modules: boolean[][], moduleCount: number): number {
  let lostPoint = 0

  // LEVEL1: Adjacent modules of same color
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      let sameCount = 0
      const dark = modules[row][col]

      for (let r = -1; r <= 1; r++) {
        if (row + r < 0 || moduleCount <= row + r) {
          continue
        }

        for (let c = -1; c <= 1; c++) {
          if (col + c < 0 || moduleCount <= col + c) {
            continue
          }

          if (r === 0 && c === 0) {
            continue
          }

          if (dark === modules[row + r][col + c]) {
            sameCount += 1
          }
        }
      }

      if (sameCount > 5) {
        lostPoint += 3 + sameCount - 5
      }
    }
  }

  // LEVEL2: 2x2 blocks of same color
  for (let row = 0; row < moduleCount - 1; row++) {
    for (let col = 0; col < moduleCount - 1; col++) {
      let count = 0
      if (modules[row][col]) count += 1
      if (modules[row + 1][col]) count += 1
      if (modules[row][col + 1]) count += 1
      if (modules[row + 1][col + 1]) count += 1
      if (count === 0 || count === 4) {
        lostPoint += 3
      }
    }
  }

  // LEVEL3: Finder-like patterns
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount - 6; col++) {
      if (
        modules[row][col] &&
        !modules[row][col + 1] &&
        modules[row][col + 2] &&
        modules[row][col + 3] &&
        modules[row][col + 4] &&
        !modules[row][col + 5] &&
        modules[row][col + 6]
      ) {
        lostPoint += 40
      }
    }
  }

  for (let col = 0; col < moduleCount; col++) {
    for (let row = 0; row < moduleCount - 6; row++) {
      if (
        modules[row][col] &&
        !modules[row + 1][col] &&
        modules[row + 2][col] &&
        modules[row + 3][col] &&
        modules[row + 4][col] &&
        !modules[row + 5][col] &&
        modules[row + 6][col]
      ) {
        lostPoint += 40
      }
    }
  }

  // LEVEL4: Dark module ratio
  let darkCount = 0
  for (let col = 0; col < moduleCount; col++) {
    for (let row = 0; row < moduleCount; row++) {
      if (modules[row][col]) {
        darkCount += 1
      }
    }
  }

  const ratio = Math.abs((100 * darkCount) / moduleCount / moduleCount - 50) / 5
  lostPoint += ratio * 10

  return lostPoint
}

// Get best mask pattern
function getBestMaskPattern(
  typeNumber: number,
  errorCorrectionLevel: QRErrorCorrectionLevel,
  dataBytes: number[],
): number {
  let minLostPoint = 0
  let pattern = 0

  for (let i = 0; i < 8; i++) {
    const moduleCount = typeNumber * 4 + 17
    const modules: (boolean | null)[][] = new Array(moduleCount)
    for (let row = 0; row < moduleCount; row++) {
      modules[row] = new Array(moduleCount).fill(null)
    }

    setupPositionProbePattern(modules, 0, 0, moduleCount)
    setupPositionProbePattern(modules, moduleCount - 7, 0, moduleCount)
    setupPositionProbePattern(modules, 0, moduleCount - 7, moduleCount)
    setupPositionAdjustPattern(modules, moduleCount, typeNumber)
    setupTimingPattern(modules, moduleCount)
    setupTypeInfo(modules, moduleCount, errorCorrectionLevel, i, true)

    if (typeNumber >= 7) {
      setupTypeNumber(modules, moduleCount, typeNumber, true)
    }

    mapData(modules, moduleCount, dataBytes, i)

    // Convert to boolean array for lost point calculation
    const boolModules: boolean[][] = modules.map((row) =>
      row.map((cell) => cell === true),
    )

    const lostPoint = getLostPoint(boolModules, moduleCount)

    if (i === 0 || minLostPoint > lostPoint) {
      minLostPoint = lostPoint
      pattern = i
    }
  }

  return pattern
}

type Location = {
  x: number
  y: number
}

type PositionProbeLocation = {
  outer: { x: number; y: number; size: number }
  inner: { x: number; y: number; size: number }
}

export function getQRMetadata({
  data,
  errorCorrectionLevel,
}: {
  data: string
  errorCorrectionLevel: QRErrorCorrectionLevel
}): QRMetadata {
  const bytes = stringToBytes(data)

  for (let typeNumber = 1; typeNumber <= 40; typeNumber++) {
    const buffer = new BitBuffer()

    // Add mode indicator (4 bits)
    buffer.put(QRMode.MODE_8BIT_BYTE, 4)

    // Add data length
    const lengthBits = getLengthInBits(QRMode.MODE_8BIT_BYTE, typeNumber)
    buffer.put(bytes.length, lengthBits)

    // Add data bytes
    for (let i = 0; i < bytes.length; i++) {
      buffer.put(bytes[i], 8)
    }

    const totalBits = buffer.getLengthInBits()
    const dataCapacity = getDataCapacity(typeNumber, errorCorrectionLevel)

    // Check if data fits (with 4 bits for terminator)
    if (totalBits + 4 <= dataCapacity * 8) {
      return {
        minTypeNumber: typeNumber as QRTypeNumber,
      }
    }
  }

  throw new Error('Data too large for QR code (exceeds type 40 capacity)')
}

type QRData = {
  /**
   * Number of modules in the QR code (e.g. 21x21 -> 21)
   */
  dimension: number

  /**
   * Locations of finder patterns
   */
  positionProbeLocations: {
    topLeft: PositionProbeLocation
    topRight: PositionProbeLocation
    bottomLeft: PositionProbeLocation
  }

  alignmentPatternLocations: PositionProbeLocation[]

  /**
   * Is given location filled?
   */
  isFilled: (location: Location) => boolean

  /**
   * Is given location in a position probe
   */
  isInPositionProbe: (location: Location) => boolean

  getLocationType: (
    location: Location,
  ) =>
    | 'positionProbeOuter'
    | 'positionProbeInner'
    | 'alignmentPatternOuter'
    | 'alignmentPatternInner'
    | 'data'
    | 'empty'
}

export function generateQRData({
  data,
  typeNumber,
  errorCorrectionLevel,
}: {
  data: string
  typeNumber: QRTypeNumber
  errorCorrectionLevel: QRErrorCorrectionLevel
}): QRData {
  if (typeNumber < 1 || typeNumber > 40) {
    throw new Error(`Invalid type number: ${typeNumber}`)
  }

  const moduleCount = typeNumber * 4 + 17
  const modules: (boolean | null)[][] = new Array(moduleCount)
  for (let row = 0; row < moduleCount; row++) {
    modules[row] = new Array(moduleCount).fill(null)
  }

  // Encode data
  const bytes = stringToBytes(data)
  const buffer = new BitBuffer()

  // Add mode indicator
  buffer.put(QRMode.MODE_8BIT_BYTE, 4)

  // Add length
  const lengthBits = getLengthInBits(QRMode.MODE_8BIT_BYTE, typeNumber)
  buffer.put(bytes.length, lengthBits)

  // Add data
  for (let i = 0; i < bytes.length; i++) {
    buffer.put(bytes[i], 8)
  }

  // Get RS blocks
  const rsBlocks = getRSBlocks(typeNumber, errorCorrectionLevel)

  // Calculate total data capacity
  let totalDataCount = 0
  for (let i = 0; i < rsBlocks.length; i++) {
    totalDataCount += rsBlocks[i].dataCount
  }

  // Check if data fits
  if (buffer.getLengthInBits() > totalDataCount * 8) {
    throw new Error(
      `Code length overflow. (${buffer.getLengthInBits()} > ${totalDataCount * 8})`,
    )
  }

  // Add terminator
  if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) {
    buffer.put(0, 4)
  }

  // Padding to byte boundary
  while (buffer.getLengthInBits() % 8 !== 0) {
    buffer.putBit(false)
  }

  // Padding bytes
  const PAD0 = 0xec
  const PAD1 = 0x11
  while (true) {
    if (buffer.getLengthInBits() >= totalDataCount * 8) {
      break
    }
    buffer.put(PAD0, 8)

    if (buffer.getLengthInBits() >= totalDataCount * 8) {
      break
    }
    buffer.put(PAD1, 8)
  }

  // Create data bytes with error correction
  // Extract exactly totalDataCount bytes from buffer
  const bufferArray = buffer.getBuffer()
  if (bufferArray.length < totalDataCount) {
    throw new Error(
      `Buffer too short: expected ${totalDataCount} bytes but got ${bufferArray.length}`,
    )
  }
  const dataBytes = bufferArray.slice(0, totalDataCount)
  const finalBytes = createErrorCorrectionBytes(dataBytes, rsBlocks)

  // Setup patterns
  setupPositionProbePattern(modules, 0, 0, moduleCount)
  setupPositionProbePattern(modules, moduleCount - 7, 0, moduleCount)
  setupPositionProbePattern(modules, 0, moduleCount - 7, moduleCount)
  setupPositionAdjustPattern(modules, moduleCount, typeNumber)
  setupTimingPattern(modules, moduleCount)

  // Get best mask pattern
  const bestMaskPattern = getBestMaskPattern(
    typeNumber,
    errorCorrectionLevel,
    finalBytes,
  )

  // Setup type info with best mask
  setupTypeInfo(
    modules,
    moduleCount,
    errorCorrectionLevel,
    bestMaskPattern,
    false,
  )

  if (typeNumber >= 7) {
    setupTypeNumber(modules, moduleCount, typeNumber, false)
  }

  // Map data
  mapData(modules, moduleCount, finalBytes, bestMaskPattern)

  // Convert to boolean array
  const boolModules: boolean[][] = modules.map((row) =>
    row.map((cell) => cell === true),
  )

  // Create finder pattern locations
  const outerSize = 7
  const innerSize = 3
  const innerOffset = 2 // Inner pattern starts at offset 2 within the 7x7 outer pattern

  const positionProbeLocations = {
    topLeft: {
      outer: { x: 0, y: 0, size: outerSize },
      inner: { x: innerOffset, y: innerOffset, size: innerSize },
    },
    topRight: {
      outer: { x: moduleCount - outerSize, y: 0, size: outerSize },
      inner: {
        x: moduleCount - outerSize + innerOffset,
        y: innerOffset,
        size: innerSize,
      },
    },
    bottomLeft: {
      outer: { x: 0, y: moduleCount - outerSize, size: outerSize },
      inner: {
        x: innerOffset,
        y: moduleCount - outerSize + innerOffset,
        size: innerSize,
      },
    },
  }

  // Helper to check if location is in finder pattern
  const isInPositionProbe = (location: Location): boolean => {
    const { x, y } = location
    const positionProbes = [
      { x: 0, y: 0 },
      { x: moduleCount - 7, y: 0 },
      { x: 0, y: moduleCount - 7 },
    ]

    for (const probe of positionProbes) {
      if (
        x >= probe.x - 1 &&
        x < probe.x + 8 &&
        y >= probe.y - 1 &&
        y < probe.y + 8
      ) {
        return true
      }
    }
    return false
  }

  // Get alignment pattern positions
  // These are the positions where alignment patterns would be placed
  // (they skip positions that overlap with position probes)
  const alignmentPositions = getPatternPosition(typeNumber)
  const alignmentPatternCenters: Location[] = []

  // Position probe areas (7x7 patterns)
  const positionProbeAreas = [
    { xMin: 0, xMax: 6, yMin: 0, yMax: 6 }, // Top-left
    { xMin: moduleCount - 7, xMax: moduleCount - 1, yMin: 0, yMax: 6 }, // Top-right
    { xMin: 0, xMax: 6, yMin: moduleCount - 7, yMax: moduleCount - 1 }, // Bottom-left
  ]

  for (let i = 0; i < alignmentPositions.length; i++) {
    for (let j = 0; j < alignmentPositions.length; j++) {
      const row = alignmentPositions[i]
      const col = alignmentPositions[j]

      // Check if this center position is within any position probe area
      // (The setup function checks modules[row][col] != null to skip overlaps)
      let isOverlapping = false
      for (const area of positionProbeAreas) {
        if (
          col >= area.xMin &&
          col <= area.xMax &&
          row >= area.yMin &&
          row <= area.yMax
        ) {
          isOverlapping = true
          break
        }
      }

      if (!isOverlapping) {
        alignmentPatternCenters.push({ x: col, y: row })
      }
    }
  }

  // Create alignment pattern locations
  // Alignment patterns are 5x5 with a 1x1 inner center
  const alignmentPatternOuterSize = 5
  const alignmentPatternInnerSize = 1
  const alignmentPatternOffset = 2 // Center offset from top-left of 5x5 pattern

  const alignmentPatternLocations: PositionProbeLocation[] =
    alignmentPatternCenters.map((center) => ({
      outer: {
        x: center.x - alignmentPatternOffset,
        y: center.y - alignmentPatternOffset,
        size: alignmentPatternOuterSize,
      },
      inner: {
        x: center.x,
        y: center.y,
        size: alignmentPatternInnerSize,
      },
    }))

  // Helper to check if location is in position probe and get type
  const getPositionProbeType = (
    location: Location,
  ): 'positionProbeOuter' | 'positionProbeInner' | null => {
    const { x, y } = location
    const positionProbeOrigins = [
      { x: 0, y: 0 }, // Top-left
      { x: moduleCount - 7, y: 0 }, // Top-right
      { x: 0, y: moduleCount - 7 }, // Bottom-left
    ]

    for (const origin of positionProbeOrigins) {
      const relX = x - origin.x
      const relY = y - origin.y

      // Check if within 7x7 pattern (0-6 relative to origin)
      if (relX >= 0 && relX <= 6 && relY >= 0 && relY <= 6) {
        // Check if it's the inner 3x3 square (r=2-4, c=2-4)
        if (relX >= 2 && relX <= 4 && relY >= 2 && relY <= 4) {
          return 'positionProbeInner'
        }
        // Check if it's part of the outer border (r=0 or r=6 or c=0 or c=6)
        if (relX === 0 || relX === 6 || relY === 0 || relY === 6) {
          return 'positionProbeOuter'
        }
      }
    }

    return null
  }

  // Helper to check if location is in alignment pattern and get type
  const getAlignmentPatternType = (
    location: Location,
  ): 'alignmentPatternOuter' | 'alignmentPatternInner' | null => {
    const { x, y } = location

    for (const center of alignmentPatternCenters) {
      const relX = x - center.x
      const relY = y - center.y

      // Check if within 5x5 pattern
      if (relX >= -2 && relX <= 2 && relY >= -2 && relY <= 2) {
        // Check if it's the inner 1x1 square (center)
        if (relX === 0 && relY === 0) {
          return 'alignmentPatternInner'
        }
        // Check if it's the outer border (r === -2 || r === 2 || c === -2 || c === 2)
        if (relX === -2 || relX === 2 || relY === -2 || relY === 2) {
          return 'alignmentPatternOuter'
        }
      }
    }

    return null
  }

  return {
    dimension: moduleCount,
    positionProbeLocations: positionProbeLocations,
    alignmentPatternLocations: alignmentPatternLocations,
    isFilled: (location: Location) => {
      const { x, y } = location
      if (x < 0 || x >= moduleCount || y < 0 || y >= moduleCount) {
        return false
      }
      return boolModules[y][x]
    },
    isInPositionProbe,
    getLocationType: (location: Location) => {
      const { x, y } = location
      if (x < 0 || x >= moduleCount || y < 0 || y >= moduleCount) {
        return 'empty'
      }

      // Check position probe first
      const positionProbeType = getPositionProbeType(location)
      if (positionProbeType) {
        return positionProbeType
      }

      // Check alignment pattern
      const alignmentPatternType = getAlignmentPatternType(location)
      if (alignmentPatternType) {
        return alignmentPatternType
      }

      // Otherwise it's data or empty
      return boolModules[y][x] ? 'data' : 'empty'
    },
  }
}

export type QRTypeNumber =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24
  | 25
  | 26
  | 27
  | 28
  | 29
  | 30
  | 31
  | 32
  | 33
  | 34
  | 35
  | 36
  | 37
  | 38
  | 39
  | 40

export type QRErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H'

// Polynomial for Reed-Solomon
class QRPolynomial {
  private num: number[]

  constructor(num: number[], shift: number = 0) {
    let offset = 0
    while (offset < num.length && num[offset] === 0) {
      offset++
    }
    this.num = new Array(num.length - offset + shift)
    for (let i = 0; i < num.length - offset; i++) {
      this.num[i] = num[i + offset]
    }
  }

  getAt(index: number): number {
    return this.num[index]
  }

  getLength(): number {
    return this.num.length
  }

  multiply(e: QRPolynomial): QRPolynomial {
    const num = new Array(this.getLength() + e.getLength() - 1)
    for (let i = 0; i < this.getLength(); i++) {
      for (let j = 0; j < e.getLength(); j++) {
        num[i + j] ^= QRMath.gexp(
          QRMath.glog(this.getAt(i)) + QRMath.glog(e.getAt(j)),
        )
      }
    }
    return new QRPolynomial(num, 0)
  }

  mod(e: QRPolynomial): QRPolynomial {
    if (this.getLength() - e.getLength() < 0) {
      return this
    }

    const ratio = QRMath.glog(this.getAt(0)) - QRMath.glog(e.getAt(0))
    const num = new Array(this.getLength())
    for (let i = 0; i < this.getLength(); i++) {
      num[i] = this.getAt(i)
    }

    for (let i = 0; i < e.getLength(); i++) {
      num[i] ^= QRMath.gexp(QRMath.glog(e.getAt(i)) + ratio)
    }

    return new QRPolynomial(num, 0).mod(e)
  }
}

// Pattern position table for alignment patterns
const PATTERN_POSITION_TABLE: number[][] = [
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
  [6, 30, 54],
  [6, 32, 58],
  [6, 34, 62],
  [6, 26, 46, 66],
  [6, 26, 48, 70],
  [6, 26, 50, 74],
  [6, 30, 54, 78],
  [6, 30, 56, 82],
  [6, 30, 58, 86],
  [6, 34, 62, 90],
  [6, 28, 50, 72, 94],
  [6, 26, 50, 74, 98],
  [6, 30, 54, 78, 102],
  [6, 28, 54, 80, 106],
  [6, 32, 58, 84, 110],
  [6, 30, 58, 86, 114],
  [6, 34, 62, 90, 118],
  [6, 26, 50, 74, 98, 122],
  [6, 30, 54, 78, 102, 126],
  [6, 26, 52, 78, 104, 130],
  [6, 30, 56, 82, 108, 134],
  [6, 34, 60, 86, 112, 138],
  [6, 30, 58, 86, 114, 142],
  [6, 34, 62, 90, 118, 146],
  [6, 30, 54, 78, 102, 126, 150],
  [6, 24, 50, 76, 102, 128, 154],
  [6, 28, 54, 80, 106, 132, 158],
  [6, 32, 58, 84, 110, 136, 162],
  [6, 26, 54, 82, 110, 138, 166],
  [6, 30, 58, 86, 114, 142, 170],
]

// RS Block table: [count, totalCount, dataCount] for each type number and error level
const RS_BLOCK_TABLE: number[][] = [
  // Type 1
  [1, 26, 19], // L
  [1, 26, 16], // M
  [1, 26, 13], // Q
  [1, 26, 9], // H
  // Type 2
  [1, 44, 34],
  [1, 44, 28],
  [1, 44, 22],
  [1, 44, 16],
  // Type 3
  [1, 70, 55],
  [1, 70, 44],
  [2, 35, 17],
  [2, 35, 13],
  // Type 4
  [1, 100, 80],
  [2, 50, 32],
  [2, 50, 24],
  [4, 25, 9],
  // Type 5
  [1, 134, 108],
  [2, 67, 43],
  [2, 33, 15, 2, 34, 16],
  [2, 33, 11, 2, 34, 12],
  // Type 6
  [2, 86, 68],
  [4, 43, 27],
  [4, 43, 19],
  [4, 43, 15],
  // Type 7
  [2, 98, 78],
  [4, 49, 31],
  [2, 32, 14, 4, 33, 15],
  [4, 39, 13, 1, 40, 14],
  // Type 8
  [2, 121, 97],
  [2, 60, 38, 2, 61, 39],
  [4, 40, 18, 2, 41, 19],
  [4, 40, 14, 2, 41, 15],
  // Type 9
  [2, 146, 116],
  [3, 58, 36, 2, 59, 37],
  [4, 36, 16, 4, 37, 17],
  [4, 36, 12, 4, 37, 13],
  // Type 10
  [2, 86, 68, 2, 87, 69],
  [4, 69, 43, 1, 70, 44],
  [6, 43, 19, 2, 44, 20],
  [6, 43, 15, 2, 44, 16],
  // Type 11
  [4, 101, 81],
  [1, 80, 50, 4, 81, 51],
  [4, 50, 22, 4, 51, 23],
  [3, 36, 12, 8, 37, 13],
  // Type 12
  [2, 116, 92, 2, 117, 93],
  [6, 58, 36, 2, 59, 37],
  [4, 46, 20, 6, 47, 21],
  [7, 42, 14, 4, 43, 15],
  // Type 13
  [4, 133, 107],
  [8, 59, 37, 1, 60, 38],
  [8, 44, 20, 4, 45, 21],
  [12, 33, 11, 4, 34, 12],
  // Type 14
  [3, 145, 115, 1, 146, 116],
  [4, 64, 40, 5, 65, 41],
  [11, 36, 16, 5, 37, 17],
  [11, 36, 12, 5, 37, 13],
  // Type 15
  [5, 109, 87, 1, 110, 88],
  [5, 65, 41, 5, 66, 42],
  [5, 54, 24, 7, 55, 25],
  [11, 36, 12, 7, 37, 13],
  // Type 16
  [5, 122, 98, 1, 123, 99],
  [7, 73, 45, 3, 74, 46],
  [15, 43, 19, 2, 44, 20],
  [3, 45, 15, 13, 46, 16],
  // Type 17
  [1, 135, 107, 5, 136, 108],
  [10, 74, 46, 1, 75, 47],
  [1, 50, 22, 15, 51, 23],
  [2, 42, 14, 17, 43, 15],
  // Type 18
  [5, 150, 120, 1, 151, 121],
  [9, 69, 43, 4, 70, 44],
  [17, 50, 22, 1, 51, 23],
  [2, 42, 14, 19, 43, 15],
  // Type 19
  [3, 141, 113, 4, 142, 114],
  [3, 70, 44, 11, 71, 45],
  [17, 47, 21, 4, 48, 22],
  [9, 39, 13, 16, 40, 14],
  // Type 20
  [3, 135, 107, 5, 136, 108],
  [3, 67, 41, 13, 68, 42],
  [15, 54, 24, 5, 55, 25],
  [15, 43, 15, 10, 44, 16],
  // Type 21
  [4, 144, 116, 4, 145, 117],
  [17, 68, 42],
  [17, 50, 22, 6, 51, 23],
  [19, 46, 16, 6, 47, 17],
  // Type 22
  [2, 139, 111, 7, 140, 112],
  [17, 74, 46],
  [7, 54, 24, 16, 55, 25],
  [34, 37, 13],
  // Type 23
  [4, 151, 121, 5, 152, 122],
  [4, 75, 47, 14, 76, 48],
  [11, 54, 24, 14, 55, 25],
  [16, 45, 15, 14, 46, 16],
  // Type 24
  [6, 147, 117, 4, 148, 118],
  [6, 73, 45, 14, 74, 46],
  [11, 54, 24, 16, 55, 25],
  [30, 46, 16, 2, 47, 17],
  // Type 25
  [8, 132, 106, 4, 133, 107],
  [8, 75, 47, 13, 76, 48],
  [7, 54, 24, 22, 55, 25],
  [22, 45, 15, 13, 46, 16],
  // Type 26
  [10, 142, 114, 2, 143, 115],
  [19, 74, 46, 4, 75, 47],
  [28, 50, 22, 6, 51, 23],
  [33, 46, 16, 4, 47, 17],
  // Type 27
  [8, 152, 122, 4, 153, 123],
  [22, 73, 45, 3, 74, 46],
  [8, 53, 23, 26, 54, 24],
  [12, 45, 15, 28, 46, 16],
  // Type 28
  [3, 147, 117, 10, 148, 118],
  [3, 73, 45, 23, 74, 46],
  [4, 54, 24, 31, 55, 25],
  [11, 45, 15, 31, 46, 16],
  // Type 29
  [7, 146, 116, 7, 147, 117],
  [21, 73, 45, 7, 74, 46],
  [1, 53, 23, 37, 54, 24],
  [19, 45, 15, 26, 46, 16],
  // Type 30
  [5, 145, 115, 10, 146, 116],
  [19, 75, 47, 10, 76, 48],
  [15, 54, 24, 25, 55, 25],
  [23, 45, 15, 25, 46, 16],
  // Type 31
  [13, 145, 115, 3, 146, 116],
  [2, 74, 46, 29, 75, 47],
  [42, 54, 24, 1, 55, 25],
  [23, 45, 15, 28, 46, 16],
  // Type 32
  [17, 145, 115],
  [10, 74, 46, 23, 75, 47],
  [10, 54, 24, 35, 55, 25],
  [19, 45, 15, 35, 46, 16],
  // Type 33
  [17, 145, 115, 1, 146, 116],
  [14, 74, 46, 21, 75, 47],
  [29, 54, 24, 19, 55, 25],
  [11, 45, 15, 46, 46, 16],
  // Type 34
  [13, 145, 115, 6, 146, 116],
  [14, 74, 46, 23, 75, 47],
  [44, 54, 24, 7, 55, 25],
  [59, 46, 16, 1, 47, 17],
  // Type 35
  [12, 151, 121, 7, 152, 122],
  [12, 75, 47, 26, 76, 48],
  [39, 54, 24, 14, 55, 25],
  [22, 45, 15, 41, 46, 16],
  // Type 36
  [6, 151, 121, 14, 152, 122],
  [6, 75, 47, 34, 76, 48],
  [46, 54, 24, 10, 55, 25],
  [2, 45, 15, 64, 46, 16],
  // Type 37
  [17, 152, 122, 4, 153, 123],
  [29, 74, 46, 14, 75, 47],
  [49, 54, 24, 10, 55, 25],
  [24, 45, 15, 46, 46, 16],
  // Type 38
  [4, 152, 122, 18, 153, 123],
  [13, 74, 46, 32, 75, 47],
  [48, 54, 24, 14, 55, 25],
  [42, 45, 15, 32, 46, 16],
  // Type 39
  [20, 147, 117, 4, 148, 118],
  [40, 75, 47, 7, 76, 48],
  [43, 54, 24, 22, 55, 25],
  [10, 45, 15, 67, 46, 16],
  // Type 40
  [19, 148, 118, 6, 149, 119],
  [18, 75, 47, 31, 76, 48],
  [34, 54, 24, 34, 55, 25],
  [20, 45, 15, 61, 46, 16],
]

// Bit buffer for encoding
class BitBuffer {
  private buffer: number[] = []
  private length = 0

  getBuffer(): number[] {
    return this.buffer
  }

  getLengthInBits(): number {
    return this.length
  }

  put(num: number, length: number): void {
    for (let i = 0; i < length; i++) {
      this.putBit(((num >>> (length - i - 1)) & 1) === 1)
    }
  }

  putBit(bit: boolean): void {
    const bufIndex = Math.floor(this.length / 8)
    if (this.buffer.length <= bufIndex) {
      this.buffer.push(0)
    }

    if (bit) {
      this.buffer[bufIndex] |= 0x80 >>> (this.length % 8)
    }

    this.length++
  }
}

// QR Math: Galois field operations
const QRMath = (() => {
  const EXP_TABLE = new Array(256)
  const LOG_TABLE = new Array(256)

  // Initialize tables
  for (let i = 0; i < 8; i++) {
    EXP_TABLE[i] = 1 << i
  }
  for (let i = 8; i < 256; i++) {
    EXP_TABLE[i] =
      EXP_TABLE[i - 4] ^ EXP_TABLE[i - 5] ^ EXP_TABLE[i - 6] ^ EXP_TABLE[i - 8]
  }
  for (let i = 0; i < 255; i++) {
    LOG_TABLE[EXP_TABLE[i]] = i
  }

  return {
    glog(n: number): number {
      if (n < 1) {
        throw new Error(`glog(${n})`)
      }
      return LOG_TABLE[n]
    },

    gexp(n: number): number {
      while (n < 0) {
        n += 255
      }
      while (n >= 256) {
        n -= 255
      }
      return EXP_TABLE[n]
    },
  }
})()
