const issueLink =
  /^https:\/\/github\.com\/([\w-]+)\/([\w.-]+)\/issues\/([1-9]\d*)\/?$/i

export function parseIssueLink(href: string) {
  const match = issueLink.exec(href)
  if (!match) return
  const [, owner, repo, number] = match
  return { repository: `${owner}/${repo}`, number }
}

export interface IssueDetails {
  title: string
  status: string
}

export async function fetchHomeIssues(): Promise<Record<string, IssueDetails>> {
  try {
    const response = await fetch('/api/github-issues', {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(6500),
    })
    if (
      response.ok &&
      response.headers.get('content-type')?.includes('application/json')
    )
      return await response.json()
  } catch {
    /* Static hosts and offline visits use the build snapshot. */
  }
  return {}
}
