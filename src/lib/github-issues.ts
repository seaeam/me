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

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
}

export function isIssueDetails(value: unknown): value is IssueDetails {
  return isRecord(value) && hasText(value.title) && hasText(value.status)
}

function isOpenIssue(value: unknown): value is OpenIssue {
  return (
    isIssueDetails(value) &&
    'number' in value &&
    isPositiveInteger(value.number)
  )
}

export function parseIssuePage(batch: unknown, page: number): IssuePage {
  if (
    !isRecord(batch) ||
    !Array.isArray(batch.issues) ||
    !batch.issues.every(isOpenIssue) ||
    (batch.nextPage !== null &&
      !(isPositiveInteger(batch.nextPage) && batch.nextPage > page))
  )
    throw new Error('Invalid project issue page')

  return { issues: batch.issues, nextPage: batch.nextPage }
}

export function parseGitHubIssueDetails(
  value: unknown,
  fallbackStatus: string,
): IssueDetails {
  if (!isRecord(value) || !hasText(value.title))
    throw new Error('Invalid GitHub issue title')

  const { title, status } = value

  if (status == null) return { title, status: fallbackStatus }
  if (!isRecord(status) || !hasText(status.name))
    throw new Error('Invalid GitHub issue status')

  return { title, status: status.name }
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

  const rows: unknown = await response.json()

  if (!Array.isArray(rows)) throw new Error('Invalid GitHub issue list')

  const issues: OpenIssue[] = []

  for (const row of rows) {
    if (
      !isRecord(row) ||
      (row.state !== 'open' && row.state !== 'closed') ||
      (row.pull_request != null && !isRecord(row.pull_request))
    )
      throw new Error('Invalid GitHub issue')

    if (row.pull_request || row.state === 'closed') continue
    if (!isPositiveInteger(row.number))
      throw new Error('Invalid GitHub issue number')

    issues.push({
      number: row.number,
      ...parseGitHubIssueDetails(row, 'Open'),
    })
  }

  return {
    issues,
    nextPage: /rel="next"/.test(response.headers.get('link') ?? '')
      ? page + 1
      : null,
  }
}
