import MarkdownIt from 'markdown-it'
import { expect, it } from 'vitest'
import { markdownProjects } from '../markdown-projects'

const markdown = new MarkdownIt({ html: true }).use(markdownProjects)

it('解析多行项目标签，保留文本前缀、属性和源码位置', () => {
  const source = [
    '# 项目',
    '',
    '最近在做：<GitHubProject',
    '  repo="Example/Site" name="主页" prefix="网站" icon="/site.svg"',
    '  :show-issues="true" />',
  ].join('\n')

  const project = markdown
    .parse(source, {})
    .find((token) => token.type === 'github_project')

  expect(project?.map).toEqual([2, 5])
  expect(project?.meta).toEqual({
    repo: 'Example/Site',
    name: '主页',
    prefix: '最近在做：网站',
    icon: '/site.svg',
    showIssues: true,
  })
})

it.each([
  ['', false],
  ['show-issues', true],
  ['show-issues="false"', false],
  [':show-issues="false"', false],
])('识别项目 issue 列表开关 %s', (attribute, expected) => {
  const [project] = markdown.parse(
    `<GitHubProject repo="example/site" ${attribute} />`,
    {},
  )

  expect(project.meta.showIssues).toBe(expected)
})

it('代码块和行内代码中的项目示例保留为普通 Markdown', () => {
  const tag = '<GitHubProject repo="example/site" show-issues />'
  const source = ['~~~html', tag, '~~~', '', `\`${tag}\``].join('\n')

  expect(
    markdown.parse(source, {}).some((token) => token.type === 'github_project'),
  ).toBe(false)
  expect(markdown.render(source)).toContain('&lt;GitHubProject')
})

it.each([
  ['<GitHubProject repo="site" />', /Expected repo=.*line 3/],
  [
    '<GitHubProject :repo="repository" />',
    /literal GitHubProject props.*line 3/,
  ],
])('报告非法项目属性所在行', (tag, error) => {
  expect(() => markdown.parse(`正文\n\n${tag}`, {})).toThrow(error)
})
