import type { ObjectDirective } from 'vue'
import { issueLabel } from '@/components/github-issue/label'
import { parseIssueLink } from '@/lib/github-issues'
import { fetchHomeIssues } from '@/services/project-issues'

export const vLiveIssues: ObjectDirective<HTMLElement> = {
  async mounted(element, binding) {
    if (binding.value === false) return

    const cards = element.querySelectorAll<HTMLAnchorElement>('a.github-issue')

    if (!cards.length) return

    for (const card of cards) card.setAttribute('aria-busy', 'true')

    const issues = await fetchHomeIssues()

    for (const card of cards) {
      const issue = parseIssueLink(card.href)
      const subject = card.querySelector('.github-issue-subject')

      if (!issue || !subject || !card.isConnected) continue

      const details = issues[card.href]

      if (details) subject.textContent = details.title

      const snapshot = card.dataset.snapshotStatus
      const status = details?.status ?? snapshot ?? '暂时无法获取状态'

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
