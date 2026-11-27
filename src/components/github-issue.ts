import { h, type ObjectDirective } from 'vue'
import { linkAttributes } from '../lib/content-links'
import { fetchIssue, parseIssueLink, type IssueDetails } from '../lib/github-issues'

interface IssueProps extends IssueDetails {
  href: string
  repository: string
  number: string
}

function issueLabel(repository: string, number: string, issue: IssueDetails) {
  return `${issue.title} · ${repository}#${number} · ${issue.status}`
}

export function GitHubIssue(props: IssueProps) {
  const { href, repository, number, title, status } = props
  const label = issueLabel(repository, number, props)
  return h('a', {
    href, ...linkAttributes(href), class: 'github-issue',
    title: label, 'aria-label': label, 'data-status': status,
  }, [
    h('span', { class: 'github-issue-icon', 'aria-hidden': 'true' }),
    h('span', { class: 'github-issue-subject' }, title),
    h('span', { class: 'github-issue-ref mono' }, `#${number}`),
  ])
}

export const vLiveIssues: ObjectDirective<HTMLElement> = {
  mounted(element) {
    const requests = new Map<string, ReturnType<typeof fetchIssue>>()
    for (const card of element.querySelectorAll<HTMLAnchorElement>('a.github-issue')) {
      const issue = parseIssueLink(card.href)
      const subject = card.querySelector('.github-issue-subject')
      if (!issue || !subject) continue

      const { repository, number } = issue
      const key = `${repository}#${number}`.toLowerCase()
      const request = requests.get(key) ?? fetchIssue(repository, number)
      requests.set(key, request)
      void request.then(details => {
        if (!details || !card.isConnected) return
        subject.textContent = details.title
        card.dataset.status = details.status
        card.title = issueLabel(repository, number, details)
        card.setAttribute('aria-label', card.title)
      })
    }
  },
}
