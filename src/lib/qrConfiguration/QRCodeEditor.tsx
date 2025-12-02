import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  TEMPLATES,
  TemplateType,
} from '@/lib/qrConfiguration/templates/template'
import { QRControls } from '@/lib/qrConfiguration/QRControls'
import { useCallback, useEffect, useMemo, useState } from 'react'

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
      qrControls: {
        template: 'standard',
        controlValues: {},
      },
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

  const activeTemplate = TEMPLATES[formData.qrControls.template]

  // Initialize control values from template defaults
  const defaultControlValues = useMemo(() => {
    const values: Record<string, unknown> = {}
    Object.entries(activeTemplate.controls).forEach(([key, control]) => {
      values[key] = control.defaultValue
    })
    return values
  }, [activeTemplate])

  // Merge existing control values with defaults (only add missing keys)
  // This ensures that when a template is loaded, all default control values are present
  useEffect(() => {
    const currentControlValues = formData.qrControls.controlValues
    const hasAllDefaults = Object.keys(defaultControlValues).every(
      (key) => key in currentControlValues,
    )
    if (!hasAllDefaults) {
      setFormData((prev) => ({
        ...prev,
        qrControls: {
          ...prev.qrControls,
          controlValues: {
            ...defaultControlValues,
            ...prev.qrControls.controlValues,
          },
        },
      }))
    }
  }, [formData.qrControls.template, defaultControlValues])

  const updateControlValue = useCallback((key: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      qrControls: {
        ...prev.qrControls,
        controlValues: {
          ...prev.qrControls.controlValues,
          [key]: value,
        },
      },
    }))
  }, [])

  // Type-safe control values for the Component
  const typedControlValues = useMemo(() => {
    const typed: Record<string, unknown> = {}
    const controlValues = formData.qrControls.controlValues
    Object.entries(activeTemplate.controls).forEach(([key, control]) => {
      typed[key] = controlValues[key] ?? control.defaultValue
    })
    return typed as {
      [K in keyof typeof activeTemplate.controls]: (typeof activeTemplate.controls)[K]['defaultValue']
    }
  }, [activeTemplate, formData.qrControls.controlValues])

  return (
    <div className="grid md:grid-cols-[2fr_1fr] gap-4">
      <div className="flex flex-col gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Title"
              id="title"
              type="text"
              placeholder="Enter title"
              value={formData.title}
              onChange={(e) => setField('title', e.target.value)}
              required
              className="w-full"
            />

            <Input
              label="Data"
              id="data"
              type="text"
              placeholder="Enter data (e.g., URL)"
              value={formData.data}
              onChange={(e) => setField('data', e.target.value)}
              required
              className="w-full"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>QR Style</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* TODO: improve styling here, horizontal carousel or something */}
            <div>
              <h3 className="text-sm font-medium mb-2">Template</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(TEMPLATES).map(([templateType, template]) => (
                  <Button
                    key={templateType}
                    onClick={() =>
                      setField('qrControls', {
                        ...formData.qrControls,
                        template: templateType as TemplateType,
                        controlValues: {},
                      })
                    }
                  >
                    {template.title}
                  </Button>
                ))}
              </div>
            </div>

            <QRControls
              controls={activeTemplate.controls}
              controlValues={formData.qrControls.controlValues}
              onControlValueChange={updateControlValue}
            />
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <activeTemplate.Component
          data={getQRUrl()}
          controlValues={typedControlValues as any}
        />

        {!!onSave && (
          <Button
            type="button"
            onClick={() => onSave?.(formData)}
            disabled={loading}
          >
            Save
          </Button>
        )}
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
  qrControls: {
    template: TemplateType
    controlValues: Record<string, unknown>
  }
}
