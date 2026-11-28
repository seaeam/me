import type { ObjectDirective } from 'vue'
import { linkAttributes } from '@/lib/content-links'

function updateLinks(element: HTMLElement) {
  const links =
    element instanceof HTMLAnchorElement
      ? [element]
      : element.querySelectorAll<HTMLAnchorElement>('a[href]')

  for (const link of links) {
    const { target, rel } = linkAttributes(link.href, window.location.origin)

    if (target && rel) {
      link.target = target
      link.rel = rel
    } else {
      link.removeAttribute('target')
      link.removeAttribute('rel')
    }
  }
}

export const vContentLinks: ObjectDirective<HTMLElement, string | undefined> = {
  mounted: updateLinks,
  updated: updateLinks,
  getSSRProps: ({ value }) => (value ? linkAttributes(value) : {}),
}
