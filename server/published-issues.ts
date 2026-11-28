import { readFile } from 'node:fs/promises'
import frontMatter from 'front-matter'
import MarkdownIt from 'markdown-it'
import { issueParagraphs, markdownProjects } from './markdown-github.js'

const homeMarkdown = new MarkdownIt({ html: true, linkify: true })
const projectMarkdown = new MarkdownIt({ html: true }).use(markdownProjects)

async function readMarkdownBody(source: string) {
  const text = await readFile(`content/${source}`, 'utf8')

  return frontMatter(text).body
}

// 站点凭据只用于首页正文中公开展示的 issue。
export async function homeIssueLinks() {
  const body = await readMarkdownBody('home.md')
  const links = issueParagraphs(homeMarkdown.parse(body, {}))

  return new Map(
    links.map(({ href, repository, number }) => [href, { repository, number }]),
  )
}

// 只有发布的项目明确开启了 issue 列表，才使用站点凭据获取数据。
export async function hasPublishedIssues(source: string, repository: string) {
  if (source !== 'home.md' && !/^posts\/[^/\\\0]+\.md$/u.test(source))
    return false

  let body: string

  try {
    body = await readMarkdownBody(source)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false

    throw error
  }

  return projectMarkdown
    .parse(body, {})
    .some(
      ({ type, meta }) =>
        type === 'github_project' &&
        meta.showIssues &&
        meta.repo.toLowerCase() === repository,
    )
}
