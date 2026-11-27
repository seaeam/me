import { h, type ObjectDirective } from 'vue'
import { linkAttributes } from '../lib/content-links'
import { fetchHomeIssues, parseIssueLink } from '../lib/github-issues'

interface IssueProps {
  href: string
  repository: string
  number: string
  title: string
  status?: string
  snapshotStatus?: string
}

function issueLabel(
  repository: string,
  number: string,
  title: string,
  status?: string,
) {
  const label = `${title} · ${repository}#${number}`
  return status ? `${label} · ${status}` : label
}

export function GitHubIssue({
  href,
  repository,
  number,
  title,
  status,
  snapshotStatus,
}: IssueProps) {
  const label = issueLabel(repository, number, title, status)
  return h(
    'a',
    {
      href,
      ...linkAttributes(href),
      class: 'github-issue',
      title: label,
      'aria-label': label,
      'data-status': status,
      'data-snapshot-status': snapshotStatus,
      'aria-busy': status === undefined ? 'true' : undefined,
    },
    [
      h('span', { class: 'github-issue-icon', 'aria-hidden': 'true' }, [
        h(
          'svg',
          {
            class: 'github-issue-progress',
            viewBox: '0 0 20 20',
            focusable: 'false',
          },
          [
            h('circle', {
              cx: 10,
              cy: 10,
              r: 5,
              pathLength: 100,
              transform: 'rotate(-90 10 10)',
              fill: 'none',
              stroke: 'currentColor',
              'stroke-width': 10,
              'stroke-dasharray': 100,
            }),
          ],
        ),
      ]),
      h('span', { class: 'github-issue-ref mono' }, `#${number}`),
      h('span', { class: 'github-issue-subject' }, title),
    ],
  )
}

export const vLiveIssues: ObjectDirective<HTMLElement> = {
  async mounted(element) {
    const cards = element.querySelectorAll<HTMLAnchorElement>('a.github-issue')
    if (!cards.length) return
    const issues = await fetchHomeIssues()
    for (const card of cards) {
      const issue = parseIssueLink(card.href)
      const subject = card.querySelector('.github-issue-subject')
      if (!issue || !subject || !card.isConnected) continue
      const details = issues[card.href]
      if (details) subject.textContent = details.title
      const snapshot = card.dataset.snapshotStatus
      const status = details?.status ?? snapshot ?? 'Status unavailable'
      const description =
        !details && snapshot ? `${status}（最近记录）` : status
      card.dataset.status = status
      card.title = issueLabel(
        issue.repository,
        issue.number,
        subject.textContent ?? '',
        description,
      )
      card.setAttribute('aria-label', card.title)
      card.setAttribute('aria-busy', 'false')
    }
  },
}
