import type MarkdownIt from 'markdown-it'
import { h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { GitHubIssue } from '../components/github-issue'

const issueLink = /^https:\/\/github\.com\/([\w-]+)\/([\w.-]+)\/issues\/([1-9]\d*)\/?$/i

async function fetchIssue(owner: string, repo: string, number: string) {
  const url = `https://api.github.com/repos/${owner}/${repo}/issues/${number}`
  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/vnd.github+json' },
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    return {
      title: typeof data.title === 'string' ? data.title : undefined,
      status: typeof data.status?.name === 'string' ? data.status.name : 'No status',
    }
  } catch (error) {
    console.warn(`[github-issue] ${owner}/${repo}#${number}:`, error instanceof Error ? error.message : error)
    return { title: undefined, status: 'Status unavailable' }
  }
}

type IssueRequests = Map<string, ReturnType<typeof fetchIssue>>
// ViteSSG loads the config twice in one process. Both bundles need the same issue snapshot.
const buildProcess = globalThis as typeof globalThis & { githubIssueRequests?: IssueRequests }

export async function renderMarkdown(markdown: MarkdownIt, source: string, isBuild: boolean) {
  const env = {}
  const tokens = markdown.parse(source, env)
  const requests: IssueRequests = isBuild
    ? (buildProcess.githubIssueRequests ??= new Map())
    : new Map()

  await Promise.all(tokens.map(async (token, index) => {
    if (token.type !== 'inline' || tokens[index - 1]?.type !== 'paragraph_open') return
    const children = token.children
    if (!children || children.length !== 3) return
    const [link, label, close] = children
    if (link.type !== 'link_open' || label.type !== 'text' || close.type !== 'link_close') return
    const href = link.attrGet('href') ?? ''
    const match = issueLink.exec(href)
    if (!match) return

    const [, owner, repo, number] = match
    const key = `${owner}/${repo}#${number}`.toLowerCase()
    const request = requests.get(key) ?? fetchIssue(owner, repo, number)
    requests.set(key, request)
    const issue = await request
    tokens[index - 1].attrJoin('class', 'github-issue-row')
    token.type = 'html_inline'
    token.content = await renderToString(h(GitHubIssue, {
      href, reference: `${repo}#${number}`, title: issue.title ?? label.content, status: issue.status,
    }))
    token.children = null
  }))
  return markdown.renderer.render(tokens, markdown.options, env)
}
