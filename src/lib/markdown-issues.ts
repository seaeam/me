import type MarkdownIt from 'markdown-it'
import { h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { GitHubIssue } from '../components/github-issue'
import { fetchIssue, parseIssueLink } from './github-issues'

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
    const match = parseIssueLink(href)
    if (!match) return

    const { repository, number } = match
    const key = `${repository}#${number}`.toLowerCase()
    const request = requests.get(key) ?? fetchIssue(repository, number)
    requests.set(key, request)
    const issue = await request
    tokens[index - 1].attrJoin('class', 'github-issue-row')
    token.type = 'html_inline'
    token.content = await renderToString(h(GitHubIssue, {
      href, repository, number, title: issue?.title ?? label.content, status: issue?.status ?? 'Status unavailable',
    }))
    token.children = null
  }))
  return markdown.renderer.render(tokens, markdown.options, env)
}
