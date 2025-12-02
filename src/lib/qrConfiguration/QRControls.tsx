import { Input } from '@/components/ui/input'
import { ControlConfig } from '@/lib/qrConfiguration/templates/template'

type Props = {
  controls: Record<string, ControlConfig<unknown>>
  controlValues: Record<string, unknown>
  onControlValueChange: (key: string, value: unknown) => void
}

export function QRControls({
  controls,
  controlValues,
  onControlValueChange,
}: Props) {
  if (Object.keys(controls).length === 0) {
    return null
  }

  return (
    <div className="mt-4">
      <div className="space-y-4">
        {Object.entries(controls).map(([key, control]) => {
          const value =
            (controlValues[key] as string) || (control.defaultValue as string)

          return (
            <div key={key}>
              <label
                htmlFor={`control-${key}`}
                className="block text-sm font-medium mb-1"
              >
                {control.label}
              </label>
              {renderControl()}
            </div>
          )

          function renderControl() {
            if (control.type === 'color') {
              return (
                <ColorControl
                  id={`control-${key}`}
                  value={value}
                  onChange={(newValue) => onControlValueChange(key, newValue)}
                />
              )
            }

            if (control.type === 'text') {
              return (
                <TextControl
                  id={`control-${key}`}
                  value={value}
                  onChange={(newValue) => onControlValueChange(key, newValue)}
                />
              )
            }

            return null
          }
        })}
      </div>
    </div>
  )
}

type ControlInputProps = {
  id: string
  value: string
  onChange: (value: string) => void
}

function ColorControl({ id, value, onChange }: ControlInputProps) {
  return (
    <Input
      id={id}
      type="color"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-10"
    />
  )
}

function TextControl({ id, value, onChange }: ControlInputProps) {
  return (
    <Input
      id={id}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full"
    />
  )
}
