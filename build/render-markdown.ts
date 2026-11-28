import { relative, resolve } from 'node:path'
import frontMatter from 'front-matter'
import MarkdownIt from 'markdown-it'
import type Token from 'markdown-it/lib/token.mjs'
import type { Plugin } from 'vite'
import { h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { issueParagraphs, markdownProjects } from '../server/markdown-github'
import { fetchIssue, projectPageSnapshot } from '../server/github-snapshots'
import { GitHubIssue } from '../src/components/github-issue/index'
import { linkAttributes } from '../src/lib/content-links'
import type {
  GitHubProjectProps,
  MarkdownSection,
} from '../src/lib/markdown-content'

const markdown = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
}).use(markdownProjects)

markdown.renderer.rules.table_open = () => '<div class="table-scroll"><table>\n'
markdown.renderer.rules.table_close = () => '</table></div>\n'
markdown.renderer.rules.link_open = (
  tokens,
  index,
  options,
  _env,
  renderer,
) => {
  const link = tokens[index]
  const { target, rel } = linkAttributes(link.attrGet('href') || '')

  if (target && rel) {
    link.attrSet('target', target)
    link.attrSet('rel', rel)
  }

  return renderer.renderToken(tokens, index, options)
}

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

async function firstProjectSnapshot(repo: string, token?: string) {
  try {
    return (await projectPageSnapshot(repo.toLowerCase(), 1, token)).value
  } catch (error) {
    console.warn(
      `[project-issues] ${repo}:`,
      error instanceof Error ? error.message : error,
    )
  }
}

export async function renderMarkdown(
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
        ? await firstProjectSnapshot(project.repo, options.githubToken)
        : undefined,
    })
    start = index + 1
  }

  if (start < tokens.length)
    sections.push({ html: render(start, tokens.length) })

  return { sections }
}

export function markdownContentPlugin(githubToken?: string): Plugin {
  return {
    name: 'site-content',
    async transform(source, id) {
      const liveIssues = id.endsWith('.md?live-issues')

      if (!liveIssues && !id.endsWith('.md')) return

      const { attributes, body } = frontMatter<Record<string, unknown>>(source)

      const content = await renderMarkdown(body, {
        liveIssues,
        githubToken,
      })

      return {
        code:
          'export default ' +
          JSON.stringify({
            ...attributes,
            ...content,
            source: relative(resolve('content'), id.split('?')[0]),
          }),
        map: null,
      }
    },
  }
}
