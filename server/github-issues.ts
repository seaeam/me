import { readFile } from 'node:fs/promises'
import frontMatter from 'front-matter'
import MarkdownIt from 'markdown-it'
import type Token from 'markdown-it/lib/token.mjs'
import {
  githubRequest,
  parseGitHubIssueDetails,
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

    if (!issue) return []

    return [
      {
        ...issue,
        href,
        title: label.content,
        fallbackStatus: link.attrGet('title'),
        token,
        paragraph,
      },
    ]
  })
}

const ttlSeconds = 60 * 60

// ViteSSG 会加载两次配置，两次渲染需要使用同一份快照。
const runtime = globalThis as typeof globalThis & {
  siteGithubIssues?: SnapshotCache<IssueDetails>
}

const issueSnapshots = (runtime.siteGithubIssues ??= new Map())

export async function fetchIssue(
  repository: string,
  number: string,
  token?: string,
) {
  const path = `${repository}/issues/${number}`

  try {
    const snapshot = await cachedSnapshot(
      issueSnapshots,
      path.toLowerCase(),
      token,
      ttlSeconds,
      async () => {
        const response = await githubRequest(path, token)

        return parseGitHubIssueDetails(await response.json(), 'No status')
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

const markdown = new MarkdownIt({ html: true, linkify: true })

// 站点凭据只用于首页正文中公开展示的 issue。
export async function homeIssueResponse(token?: string) {
  const source = await readFile('content/home.md', 'utf8')
  const { body } = frontMatter(source)
  const issues = issueParagraphs(markdown.parse(body, {}))
  const links = new Map(issues.map((issue) => [issue.href, issue]))
  const result: Record<string, IssueDetails> = {}
  let expiresAt = Infinity

  await Promise.all(
    Array.from(links.values(), async ({ href, repository, number }) => {
      const details = await fetchIssue(repository, number, token)

      if (!details) return

      result[href] = { title: details.title, status: details.status }
      expiresAt = Math.min(expiresAt, details.expiresAt)
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
