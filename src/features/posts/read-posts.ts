import { optionalText, requiredText } from '@/lib/content-fields'
import type { MarkdownContent } from '@/lib/markdown-content'

export type Article = MarkdownContent & {
  title: string
  date: string
  slug: string
  duration?: string
}

export type CompiledPost = MarkdownContent & Record<string, unknown>

function publicationDate(value: unknown, path: string) {
  const text = requiredText(value, path)
  const timestamp = text.replace(/^(\d{4}-\d{2}-\d{2})[T ]([\d:.]+)$/, '$1T$2Z')
  const date = new Date(timestamp)
  const calendarDay = text.match(/^\d{4}-\d{2}-\d{2}/)?.[0]

  if (Number.isNaN(date.getTime())) throw new Error(path + ' 应为有效日期')

  if (calendarDay) {
    const day = new Date(calendarDay + 'T00:00:00Z')

    if (
      Number.isNaN(day.getTime()) ||
      day.toISOString().slice(0, 10) !== calendarDay
    ) {
      throw new Error(path + ' 应为有效日期')
    }
  }

  return text === calendarDay ? text : date.toISOString()
}

export function readPosts(files: Record<string, CompiledPost>): Article[] {
  return Object.entries(files)
    .map(([path, page]) => ({
      ...page,
      title: requiredText(page.title, page.source + '.title'),
      date: publicationDate(page.date, page.source + '.date'),
      duration: optionalText(page.duration, page.source + '.duration'),
      slug: path.slice(path.lastIndexOf('/') + 1, -3),
    }))
    .sort((left, right) => right.date.localeCompare(left.date))
}
