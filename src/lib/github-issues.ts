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

export interface GitHubProjectProps {
  repo: string
  name?: string
  icon?: string
  prefix?: string
  showIssues?: boolean
}

export function normalizeRepository(repo: string) {
  const name = repo.trim()
  if (/^[\w-]+\/[\w.-]+$/.test(name) && !/\/\.{1,2}$/.test(name))
    return name.toLowerCase()
}

export interface OpenIssue extends IssueDetails {
  number: number
}

export interface IssuePage {
  issues: OpenIssue[]
  nextPage: number | null
}

export async function githubRequest(
  path: string,
  token?: string,
  signal = AbortSignal.timeout(5000),
) {
  const response = await fetch(`https://api.github.com/repos/${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    signal,
    redirect: 'error',
  })
  if (!response.ok) throw new Error(`GitHub HTTP ${response.status}`)
  return response
}

export async function fetchGitHubIssuePage(
  repository: string,
  page: number,
  token?: string,
  signal?: AbortSignal,
): Promise<IssuePage> {
  const params = new URLSearchParams({
    state: 'open',
    sort: 'created',
    direction: 'asc',
    per_page: '10',
    page: String(page),
  })
  const response = await githubRequest(
    `${repository}/issues?${params}`,
    token,
    signal,
  )
  const rows = await response.json()
  if (!Array.isArray(rows)) throw new Error('Invalid GitHub issue list')
  const issues: OpenIssue[] = []
  for (const row of rows) {
    if (row.pull_request || row.state !== 'open') continue
    if (!Number.isSafeInteger(row.number) || typeof row.title !== 'string')
      throw new Error('Invalid GitHub issue')
    issues.push({
      number: row.number,
      title: row.title,
      status: typeof row.status?.name === 'string' ? row.status.name : 'Open',
    })
  }
  return {
    issues,
    nextPage: /rel="next"/.test(response.headers.get('link') ?? '')
      ? page + 1
      : null,
  }
}

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
  // Static hosts can serve a 404 or the site's HTML for an unknown API route.
  if (!isJson && (response.ok || response.status === 404))
    return fetchGitHubIssuePage(repository, page, undefined, signal)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
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
