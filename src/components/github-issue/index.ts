import { h } from 'vue'
import { linkAttributes } from '../../lib/content-links'
import { issueLabel } from './label'

interface IssueProps {
  href: string
  repository: string
  number: string
  title: string
  status?: string
  snapshotStatus?: string
}

export function GitHubIssue({
  href,
  repository,
  number,
  title,
  status,
  snapshotStatus,
}: IssueProps) {
  const description =
    status ?? (snapshotStatus ? `${snapshotStatus}（最近记录）` : '状态未知')

  const label = issueLabel(repository, number, title, description)

  return h(
    'a',
    {
      href,
      ...linkAttributes(href),
      class: 'github-issue',
      title: label,
      'aria-label': label,
      'data-status': status ?? snapshotStatus,
      'data-snapshot-status': snapshotStatus,
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
