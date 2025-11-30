import { QRCodeSVG } from '@/components/QRCodeSVG'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCallback, useState } from 'react'

type Props = {
  initialData?: QRCodeFormData
  onSave?: (data: QRCodeFormData) => Promise<unknown>
  loading?: boolean // Really should be more general...

  forcedQRUrl?: string
}

export function QRCodeEditor({
  initialData,
  onSave,
  loading,
  forcedQRUrl,
}: Props) {
  const [formData, setFormData] = useState<QRCodeFormData>(
    initialData || {
      title: '',
      type: 'static',
      data: '',
    },
  )

  const setField = useCallback(
    <TField extends keyof QRCodeFormData>(
      field: TField,
      value: QRCodeFormData[TField],
    ) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
    },
    [setFormData],
  )

  return (
    <div className="grid md:grid-cols-[2fr_1fr] gap-4">
      <div>
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-2">
            Title
          </label>
          <Input
            id="title"
            type="text"
            placeholder="Enter title"
            value={formData.title}
            onChange={(e) => setField('title', e.target.value)}
            required
            className="w-full"
          />
        </div>
        <div>
          <label htmlFor="data" className="block text-sm font-medium mb-2">
            Data
          </label>
          <Input
            id="data"
            type="text"
            placeholder="Enter data (e.g., URL)"
            value={formData.data}
            onChange={(e) => setField('data', e.target.value)}
            required
            className="w-full"
          />
        </div>

        {!!onSave && (
          <Button
            type="button"
            onClick={() => onSave(formData)}
            disabled={loading}
          >
            Save
          </Button>
        )}
      </div>
      <div>
        <QRCodeSVG data={getQRUrl()} typeNumber={3} errorCorrectionLevel="M" />
      </div>
    </div>
  )

  function getQRUrl() {
    if (forcedQRUrl) {
      return forcedQRUrl
    }

    return formData.data
  }
}

type QRCodeFormData = {
  title: string
  type: 'static' | 'url'
  data: string
}
