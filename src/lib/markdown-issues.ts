import type MarkdownIt from 'markdown-it'
import { h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { GitHubIssue } from '../components/github-issue'
import { fetchIssue, issueParagraphs } from '../../server/github-issues'
import { projectIssueSnapshot } from '../../server/project-issues'
import type { MarkdownSection } from './markdown-content'
import type { GitHubProjectProps } from './github-issues'

export async function renderMarkdown(
  markdown: MarkdownIt,
  source: string,
  {
    liveIssues,
    githubToken,
  }: {
    liveIssues: boolean
    githubToken?: string
  },
) {
  const env = {}
  const tokens = markdown.parse(source, env)
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
            status: liveIssues ? undefined : (status ?? 'Status unavailable'),
            snapshotStatus: liveIssues ? status : undefined,
          }),
        )
        token.children = null
      },
    ),
  )
  const render = (start: number, end: number) =>
    markdown.renderer.render(tokens.slice(start, end), markdown.options, env)
  const sections: MarkdownSection[] = []
  let start = 0
  for (const [index, token] of tokens.entries()) {
    if (token.type !== 'github_project') continue
    if (start < index) sections.push({ html: render(start, index) })
    const project: GitHubProjectProps = token.meta
    sections.push({
      project,
      snapshot: project.showIssues
        ? await projectIssueSnapshot(project.repo, githubToken)
        : undefined,
    })
    start = index + 1
  }
  if (start < tokens.length)
    sections.push({ html: render(start, tokens.length) })
  return { sections }
}
