import qrcode from 'qrcode-generator'
import { describe, expect, it } from 'vitest'
import { generateQRData, getQRMetadata, QRErrorCorrectionLevel } from './qr'

const TEST_CASES: string[] = ['https://gksander.com', 'Meow', '🐱']

describe('generate QR data that matches qrcode-generator', () => {
  for (const data of TEST_CASES) {
    for (const errorCorrectionLevel of [
      'L',
      'M',
      'H',
      'Q',
    ] as QRErrorCorrectionLevel[]) {
      const { minTypeNumber } = getQRMetadata({ data, errorCorrectionLevel })
      for (let typeNumber = minTypeNumber; typeNumber <= 40; typeNumber++) {
        it(`should generate QR data for ${data} with type number ${typeNumber} and error correction level ${errorCorrectionLevel}`, () => {
          // QR code generator
          const qr = qrcode(typeNumber, errorCorrectionLevel)
          qr.addData(data)
          qr.make()
          const moduleCount = qr.getModuleCount()

          const libraryFilledPattern: (1 | 0)[] = []
          for (let row = 0; row < moduleCount; row++) {
            for (let col = 0; col < moduleCount; col++) {
              libraryFilledPattern.push(qr.isDark(row, col) ? 1 : 0)
            }
          }

          const { dimension, isFilled, isInFinderPattern } = generateQRData({
            data,
            typeNumber,
            errorCorrectionLevel,
          })
          const localFilledPattern: (1 | 0)[] = []
          for (let row = 0; row < dimension; row++) {
            for (let col = 0; col < dimension; col++) {
              localFilledPattern.push(isFilled({ x: col, y: row }) ? 1 : 0)
            }
          }

          expect(localFilledPattern.join('')).toEqual(
            libraryFilledPattern.join(''),
          )
        })
      }
    }
  }
})
