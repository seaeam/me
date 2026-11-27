const issueLink = /^https:\/\/github\.com\/([\w-]+)\/([\w.-]+)\/issues\/([1-9]\d*)\/?$/i

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

export async function fetchIssue(repository: string, number: string): Promise<IssueDetails | undefined> {
  try {
    const response = await fetch(`https://api.github.com/repos/${repository}/issues/${number}`, {
      headers: { Accept: 'application/vnd.github+json' },
      cache: 'no-cache',
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    if (typeof data.title !== 'string') throw new Error('Missing issue title')
    return {
      title: data.title,
      status: typeof data.status?.name === 'string' ? data.status.name : 'No status',
    }
  } catch (error) {
    console.warn(`[github-issue] ${repository}#${number}:`, error instanceof Error ? error.message : error)
  }
}
