import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import MarkdownIt from 'markdown-it'
import type Token from 'markdown-it/lib/token.mjs'
import { parseIssueLink, type IssueDetails } from '../src/lib/github-issues.js'

export function issueParagraphs(tokens: Token[]) {
  return tokens.flatMap((token, index) => {
    const paragraph = tokens[index - 1]
    if (
      paragraph?.type !== 'paragraph_open' ||
      token.type !== 'inline' ||
      token.children?.length !== 3
    )
      return []
    const [link, label, close] = token.children
    if (
      link.type !== 'link_open' ||
      label.type !== 'text' ||
      close.type !== 'link_close'
    )
      return []
    const href = link.attrGet('href') ?? ''
    const issue = parseIssueLink(href)
    return issue
      ? [
          {
            ...issue,
            href,
            title: label.content,
            fallbackStatus: link.attrGet('title'),
            token,
            paragraph,
          },
        ]
      : []
  })
}

const ttlSeconds = 60 * 60
type IssueSnapshot = IssueDetails & { expiresAt: number }
type CacheEntry = {
  request: Promise<IssueSnapshot | undefined>
  expiresAt: number
}
// ViteSSG loads the config twice in one process. Share the authenticated snapshot across both bundles.
const runtime = globalThis as typeof globalThis & {
  siteGithubIssues?: Map<string, CacheEntry>
}
const cache = (runtime.siteGithubIssues ??= new Map<string, CacheEntry>())

async function requestIssue(
  repository: string,
  number: string,
  token?: string,
): Promise<IssueSnapshot | undefined> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${repository}/issues/${number}`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        signal: AbortSignal.timeout(5000),
        redirect: 'error',
      },
    )
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    if (typeof data.title !== 'string') throw new Error('Missing issue title')
    return {
      title: data.title,
      status:
        typeof data.status?.name === 'string' ? data.status.name : 'No status',
      expiresAt: Date.now() + ttlSeconds * 1000,
    }
  } catch (error) {
    console.warn(
      `[github-issue] ${repository}#${number}:`,
      error instanceof Error ? error.message : error,
    )
  }
}

export function fetchIssue(repository: string, number: string, token?: string) {
  const account = token
    ? createHash('sha256').update(token).digest('hex')
    : 'anonymous'
  const key = `${account}:${repository.toLowerCase()}#${number}`
  const cached = cache.get(key)
  if (cached && Date.now() < cached.expiresAt) return cached.request

  const entry = {
    request: requestIssue(repository, number, token),
    expiresAt: Infinity,
  }
  cache.set(key, entry)
  void entry.request.then((issue) => {
    if (issue) entry.expiresAt = issue.expiresAt
    else cache.delete(key)
  })
  return entry.request
}

const markdown = new MarkdownIt({ linkify: true })

// Only the issue links published in the homepage can be read with the owner's credential.
export async function homeIssueResponse(token?: string) {
  const source = await readFile('content/home.md', 'utf8')
  const issues = issueParagraphs(markdown.parse(source, {}))
  const result: Record<string, IssueDetails> = {}
  let expiresAt = Infinity
  const links = new Map(issues.map((issue) => [issue.href, issue]))
  await Promise.all(
    Array.from(links.values(), async ({ href, repository, number }) => {
      const details = await fetchIssue(repository, number, token)
      if (details) {
        result[href] = { title: details.title, status: details.status }
        expiresAt = Math.min(expiresAt, details.expiresAt)
      }
    }),
  )
  const found = Object.keys(result).length
  const complete = found === links.size
  const maxAge = Math.min(
    ttlSeconds,
    Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)),
  )
  return Response.json(result, {
    status: found > 0 || complete ? 200 : 503,
    headers: {
      'Cache-Control': complete
        ? `public, max-age=${maxAge}, s-maxage=${maxAge}`
        : 'no-store',
    },
  })
}
