import type MarkdownIt from 'markdown-it'
import type Token from 'markdown-it/lib/token.mjs'
import { h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { GitHubIssue } from '../components/github-issue'
import { fetchIssue, issueParagraphs } from '../../server/github-issues'
import { projectIssueSnapshot } from '../../server/project-issues'
import type { MarkdownSection } from './markdown-content'
import type { GitHubProjectProps } from './github-issues'

interface IssueRenderOptions {
  liveIssues: boolean
  githubToken?: string
}

async function renderIssueCards(
  tokens: Token[],
  { liveIssues, githubToken }: IssueRenderOptions,
) {
  await Promise.all(
    issueParagraphs(tokens).map(
      async ({
        repository,
        number,
        href,
        title,
        fallbackStatus,
        paragraph,
        token,
      }) => {
        const issue = await fetchIssue(repository, number, githubToken)
        const status = issue?.status ?? fallbackStatus ?? undefined

        paragraph.attrJoin('class', 'github-issue-row')
        token.type = 'html_inline'
        token.content = await renderToString(
          h(GitHubIssue, {
            href,
            repository,
            number,
            title: issue?.title ?? title,
            status: liveIssues ? undefined : (status ?? '暂时无法获取状态'),
            snapshotStatus: liveIssues ? status : undefined,
          }),
        )
        token.children = null
      },
    ),
  )
}

export async function renderMarkdown(
  markdown: MarkdownIt,
  source: string,
  options: IssueRenderOptions,
) {
  const env = {}
  const tokens = markdown.parse(source, env)

  const render = (start: number, end: number) =>
    markdown.renderer.render(tokens.slice(start, end), markdown.options, env)

  const sections: MarkdownSection[] = []
  let start = 0

  await renderIssueCards(tokens, options)

  for (const [index, token] of tokens.entries()) {
    if (token.type !== 'github_project') continue

    if (start < index) sections.push({ html: render(start, index) })

    const project: GitHubProjectProps = token.meta

    sections.push({
      project,
      snapshot: project.showIssues
        ? await projectIssueSnapshot(project.repo, options.githubToken)
        : undefined,
    })
    start = index + 1
  }

  if (start < tokens.length)
    sections.push({ html: render(start, tokens.length) })

  return { sections }
}
