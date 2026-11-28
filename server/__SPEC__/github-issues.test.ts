import { readFile } from 'node:fs/promises'
import MarkdownIt from 'markdown-it'
import { beforeEach, expect, it, vi } from 'vitest'
import { homeIssueResponse, issueParagraphs } from '../github-issues'

vi.mock('node:fs/promises', () => ({ readFile: vi.fn() }))

const fetchIssueData = vi.fn<typeof fetch>()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchIssueData.mockReset())
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

it('从独占段落的链接提取编号、标题和备用状态', () => {
  const href = 'https://github.com/example/site/issues/42'
  const markdown = new MarkdownIt()

  const source = [
    `[修正排版](${href} "In review")`,
    `见 [讨论](${href})`,
    '[仓库](https://github.com/example/site)',
    `~~~md\n[示例](${href})\n~~~`,
  ].join('\n\n')

  const issues = issueParagraphs(markdown.parse(source, {}))

  expect(issues).toHaveLength(1)
  expect(issues[0]).toMatchObject({
    href,
    title: '修正排版',
    fallbackStatus: 'In review',
    repository: 'example/site',
    number: '42',
  })
})

it('首页没有独立 issue 链接时返回可缓存的空结果', async () => {
  vi.mocked(readFile).mockResolvedValue('# 首页')

  const response = await homeIssueResponse()

  expect(response.status).toBe(200)
  expect(await response.json()).toEqual({})
  expect(response.headers.get('cache-control')).toContain('max-age=3600')
  expect(fetchIssueData).not.toHaveBeenCalled()
})

it('去重同一链接，在部分请求失败时只返回已知结果并禁止缓存', async () => {
  const first = 'https://github.com/example/partial/issues/1'
  const second = 'https://github.com/example/partial/issues/2'

  vi.mocked(readFile).mockResolvedValue(
    `[一](${first})\n\n[重复](${first})\n\n[二](${second})`,
  )
  fetchIssueData
    .mockResolvedValueOnce(Response.json({ title: '更新标题', status: null }))
    .mockResolvedValueOnce(new Response(null, { status: 503 }))

  const response = await homeIssueResponse()

  expect(response.status).toBe(200)
  expect(await response.json()).toEqual({
    [first]: { title: '更新标题', status: 'No status' },
  })
  expect(response.headers.get('cache-control')).toBe('no-store')
  expect(fetchIssueData).toHaveBeenCalledTimes(2)
})

it('所有链接均缺少标题时返回暂不可用', async () => {
  vi.mocked(readFile).mockResolvedValue(
    '[一](https://github.com/example/invalid/issues/1)',
  )
  fetchIssueData.mockResolvedValueOnce(Response.json({ state: 'open' }))

  const response = await homeIssueResponse()

  expect(response.status).toBe(503)
  expect(response.headers.get('cache-control')).toBe('no-store')
})

it.each([
  [1, { title: '  ', status: null }],
  [2, { title: '文档反馈', status: { name: 42 } }],
])('上游字段异常时不发布有效快照，第 %i 条 issue', async (number, data) => {
  vi.mocked(readFile).mockResolvedValue(
    `[文档反馈](https://github.com/example/fields/issues/${number})`,
  )
  fetchIssueData.mockResolvedValueOnce(Response.json(data))

  const response = await homeIssueResponse()

  expect(response.status).toBe(503)
  expect(response.headers.get('cache-control')).toBe('no-store')
})

it('只读取首页正文展示的链接，忽略文章元数据中的多行示例', async () => {
  const source = [
    '---',
    'description: |',
    '',
    '  [编辑笔记](https://github.com/example/metadata/issues/1)',
    '',
    '---',
    '# 首页',
  ].join('\n')

  vi.mocked(readFile).mockResolvedValue(source)

  const response = await homeIssueResponse()

  expect(response.status).toBe(200)
  expect(await response.json()).toEqual({})
  expect(fetchIssueData).not.toHaveBeenCalled()
})

it('忽略首页 HTML 注释中未展示的 Markdown 链接', async () => {
  vi.mocked(readFile).mockResolvedValue(
    '<!--\n\n[未发布](https://github.com/example/draft/issues/1)\n\n-->',
  )

  const response = await homeIssueResponse()

  expect(response.status).toBe(200)
  expect(await response.json()).toEqual({})
  expect(fetchIssueData).not.toHaveBeenCalled()
})
