import { QRTypeNumber, QRErrorCorrectionLevel } from '@/lib/qr'

type Props = {
  data: string
  typeNumber: QRTypeNumber
  errorCorrectionLevel: QRErrorCorrectionLevel
}

export function QRCodeSVG({ data, typeNumber, errorCorrectionLevel }: Props) {
  return <div>QRCodeSVG</div>
}
