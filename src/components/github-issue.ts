import { h } from 'vue'
import { linkAttributes } from '../lib/content-links'

const slash = 'm5.7 10.3 4.6-4.6'
const statusIcons = new Map<string, [tone: string, path: string]>([
  ['Backlog', ['active', 'M8 8h.01']],
  ['Todo', ['active', 'M8 4a4 4 0 0 1 4 4']],
  ['In progress', ['active', 'M8 4a4 4 0 1 1 0 8']],
  ['In review', ['active', 'M8 4a4 4 0 1 1-4 4']],
  ['Done', ['done', 'm4.9 8.1 2.05 2.05 4.15-4.25']],
  ['Not planned', ['muted', slash]],
  ['Duplicate', ['muted', slash]],
])

interface IssueProps {
  href: string
  title: string
  reference: string
  status: string
}

export function GitHubIssue({ href, title, reference, status }: IssueProps) {
  const [tone, path] = statusIcons.get(status) ?? ['muted', '']
  const icon = h('svg', {
    viewBox: '0 0 16 16', width: 15, height: 15, 'aria-hidden': 'true',
    fill: 'none', stroke: 'currentColor', 'stroke-width': 1.5,
    'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'data-tone': tone,
  }, [
    h('circle', { cx: 8, cy: 8, r: 6.6 }),
    path && h('path', { d: path, 'stroke-width': status === 'Backlog' ? 2.8 : undefined }),
  ])

  return h('a', {
    href, ...linkAttributes(href), class: 'github-issue',
    'aria-label': `GitHub Issue · ${title} · ${reference} · ${status}`,
  }, [
    h('span', { class: 'github-issue-subject' }, [
      h('span', { class: 'github-issue-mark', 'aria-hidden': 'true' }), title,
    ]),
    h('span', { class: 'github-issue-ref mono' }, reference),
    h('span', { class: 'github-issue-status' }, [icon, status]),
  ])
}
