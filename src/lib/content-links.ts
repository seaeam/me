import type { ObjectDirective } from 'vue'

// 静态构建时域名尚未确定，相对地址按站内处理；挂载后用访问者的实际来源核对绝对地址。
export function linkAttributes(href: string, origin = 'https://site.invalid') {
  let url: URL
  try {
    url = new URL(href, origin)
  } catch {
    return {}
  }
  if (
    (url.protocol === 'https:' || url.protocol === 'http:') &&
    url.origin !== origin
  )
    return { target: '_blank', rel: 'noopener' }
  return {}
}

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
