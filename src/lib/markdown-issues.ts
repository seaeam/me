import type MarkdownIt from 'markdown-it'
import { h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { GitHubIssue } from '../components/github-issue'
import { fetchIssue, issueParagraphs } from '../../server/github-issues'

export async function renderMarkdown(
  markdown: MarkdownIt,
  source: string,
  { liveIssues, githubToken }: { liveIssues: boolean; githubToken?: string },
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
  return markdown.renderer.render(tokens, markdown.options, env)
}
