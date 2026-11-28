import {
  fetchGitHubIssuePage,
  isIssueDetails,
  isRecord,
  parseIssueLink,
  parseIssuePage,
  type IssueDetails,
  type IssuePage,
} from '../lib/github-issues'

export async function fetchProjectIssuePage(
  repository: string,
  page: number,
  signal: AbortSignal,
  source?: string,
): Promise<IssuePage> {
  if (!source) return fetchGitHubIssuePage(repository, page, undefined, signal)

  const params = new URLSearchParams({ repository, page: String(page), source })

  const response = await fetch(`/api/github-issues?${params}`, {
    headers: { Accept: 'application/json' },
    signal,
  })

  const isJson = response.headers
    .get('content-type')
    ?.includes('application/json')

  // 静态托管可能向 API 请求返回站点 HTML 或 404 页面。
  if (!isJson && (response.ok || response.status === 404))
    return fetchGitHubIssuePage(repository, page, undefined, signal)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)

  const batch: unknown = await response.json()

  return parseIssuePage(batch, page)
}

export async function fetchHomeIssues(): Promise<Record<string, IssueDetails>> {
  try {
    const response = await fetch('/api/github-issues', {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(6500),
    })

    if (
      !response.ok ||
      !response.headers.get('content-type')?.includes('application/json')
    )
      return {}

    const records: unknown = await response.json()

    if (!isRecord(records)) return {}

    const issues: Record<string, IssueDetails> = {}

    for (const [href, details] of Object.entries(records)) {
      if (parseIssueLink(href) && isIssueDetails(details))
        issues[href] = details
    }

    return issues
  } catch {
    // 静态站和离线访问沿用构建时的快照。
    return {}
  }
}
