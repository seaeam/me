export function contentRecord(value: unknown, path: string) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(path + ' 应为对象')
  }

  return value as Record<string, unknown>
}

export function optionalText(value: unknown, path: string) {
  if (value == null) return undefined

  if (typeof value !== 'string') throw new Error(path + ' 应为文本')

  return value.trim() || undefined
}

export function requiredText(value: unknown, path: string) {
  const text = optionalText(value, path)

  if (!text) throw new Error(path + ' 不能为空')

  return text
}
