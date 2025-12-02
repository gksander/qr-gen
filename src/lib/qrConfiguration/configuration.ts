import {
  TEMPLATES,
  TemplateType,
} from '@/lib/qrConfiguration/templates/template'
import { z } from 'zod'

// Get template keys as a tuple for zod enum
const templateKeys = Object.keys(TEMPLATES) as [TemplateType, ...TemplateType[]]

// Zod schema for QR configuration
export const qrConfigSchema = z.object({
  template: z.enum(templateKeys),
  controlValues: z.record(z.string(), z.unknown()).default({}),
})

export type QRConfig = z.infer<typeof qrConfigSchema>

// Default QR config
export const defaultQRConfig: QRConfig = {
  template: 'standard',
  controlValues: {},
}

/**
 * Parse and validate qrConfig from a JSON string
 * Returns the validated config or the default config if parsing/validation fails
 */
export function parseQRConfig(jsonString: string | null | undefined): QRConfig {
  if (!jsonString) {
    return defaultQRConfig
  }

  try {
    const parsed = JSON.parse(jsonString)
    const result = qrConfigSchema.safeParse(parsed)

    if (result.success) {
      return result.data
    }

    // If validation fails, return default with template from parsed data if valid
    const template =
      parsed.template && TEMPLATES[parsed.template as TemplateType]
        ? (parsed.template as TemplateType)
        : 'standard'

    return {
      template,
      controlValues:
        typeof parsed.controlValues === 'object' &&
        parsed.controlValues !== null &&
        !Array.isArray(parsed.controlValues)
          ? parsed.controlValues
          : {},
    }
  } catch {
    return defaultQRConfig
  }
}

/**
 * Validate and stringify qrConfig
 * Throws if validation fails
 */
export function stringifyQRConfig(config: QRConfig): string {
  const result = qrConfigSchema.safeParse(config)

  if (!result.success) {
    throw new Error(`Invalid QR config: ${result.error.message}`)
  }

  return JSON.stringify(result.data)
}

// Legacy type export for backwards compatibility
export type QRConfiguration = QRConfig
