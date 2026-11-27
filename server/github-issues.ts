import { readFile } from 'node:fs/promises'
import MarkdownIt from 'markdown-it'
import type Token from 'markdown-it/lib/token.mjs'
import {
  githubRequest,
  parseIssueLink,
  type IssueDetails,
} from '../src/lib/github-issues.js'
import { cachedSnapshot, type SnapshotCache } from './github-cache.js'

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
// ViteSSG loads its config twice. Both builds must render the same snapshot.
const runtime = globalThis as typeof globalThis & {
  siteGithubIssues?: SnapshotCache<IssueDetails>
}
const cache = (runtime.siteGithubIssues ??= new Map())

export async function fetchIssue(
  repository: string,
  number: string,
  token?: string,
) {
  const path = `${repository}/issues/${number}`
  try {
    const snapshot = await cachedSnapshot(
      cache,
      path.toLowerCase(),
      token,
      ttlSeconds,
      async () => {
        const response = await githubRequest(path, token)
        const data = await response.json()
        if (typeof data.title !== 'string')
          throw new Error('Missing issue title')
        return {
          title: data.title,
          status:
            typeof data.status?.name === 'string'
              ? data.status.name
              : 'No status',
        }
      },
    )
    return { ...snapshot.value, expiresAt: snapshot.expiresAt }
  } catch (error) {
    console.warn(
      `[github-issue] ${path}:`,
      error instanceof Error ? error.message : error,
    )
  }
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
