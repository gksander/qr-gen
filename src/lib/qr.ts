type QRMetadata = {
  minTypeNumber: QRTypeNumber
  maxTypeNumber: QRTypeNumber
}

export function getQRMetadata({
  data,
  errorCorrectionLevel,
}: {
  data: string
  errorCorrectionLevel: QRErrorCorrectionLevel
}): QRMetadata {
  // TODO: fill these in
  return {
    minTypeNumber: 0,
    maxTypeNumber: 40,
  }
}

type Location = {
  x: number
  y: number
}

type FinderPatternLocation = Location & {
  size: number
}

type QRData = {
  /**
   * Number of modules in the QR code (e.g. 21x21 -> 21)
   */
  moduleCount: number

  /**
   * Locations of finder patterns
   */
  finderPatternLocations: {
    topLeft: FinderPatternLocation
    topRight: FinderPatternLocation
    bottomLeft: FinderPatternLocation
  }

  /**
   * Is given location filled?
   */
  isFilled: (location: Location) => boolean

  /**
   * Is given location in a finder pattern?
   */
  isInFinderPattern: (location: Location) => boolean
}

export function generateQRData({}: {
  data: string
  typeNumber: QRTypeNumber
  errorCorrectionLevel: QRErrorCorrectionLevel
}): QRData {
  // TODO:
}

type QRTypeNumber =
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

type QRErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H'
