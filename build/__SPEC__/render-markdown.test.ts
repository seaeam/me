import { expect, it, vi } from 'vitest'
import { renderMarkdown } from '../render-markdown'

it('按原文顺序输出正文与项目，只为启用 issue 的项目附加快照', async () => {
  const fetchPage = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(Response.json([]))

  vi.stubGlobal('fetch', fetchPage)

  const source = [
    '# 开头',
    '<GitHubProject repo="example/markdown" show-issues />',
    '中间段落',
    '<GitHubProject repo="example/other" />',
    '结尾',
  ].join('\n\n')

  const content = await renderMarkdown(source, { liveIssues: false })

  expect(content.sections).toEqual([
    { html: '<h1>开头</h1>\n' },
    {
      project: expect.objectContaining({ repo: 'example/markdown' }),
      snapshot: { issues: [], nextPage: null },
    },
    { html: '<p>中间段落</p>\n' },
    {
      project: expect.objectContaining({ repo: 'example/other' }),
      snapshot: undefined,
    },
    { html: '<p>结尾</p>\n' },
  ])
  expect(fetchPage).toHaveBeenCalledTimes(1)
})

it('静态 issue 卡片显示上游标题和状态，并转义标题中的 HTML', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        Response.json({ title: '修改 <style>', status: { name: 'In review' } }),
      ),
  )

  const { sections } = await renderMarkdown(
    '[旧标题](https://github.com/example/render/issues/34)',
    { liveIssues: false },
  )

  expect(sections).toEqual([
    { html: expect.stringContaining('data-status="In review"') },
  ])
  expect(sections[0]).toMatchObject({
    html: expect.stringContaining('修改 &lt;style&gt;'),
  })
})

it('实时卡片在断网时保留作者提供的标题和状态，供客户端恢复', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof fetch>().mockRejectedValueOnce(new Error('离线')),
  )
  vi.spyOn(console, 'warn').mockImplementation(() => {})

  const { sections } = await renderMarkdown(
    '[作者记录](https://github.com/example/render/issues/35 "Todo")',
    { liveIssues: true },
  )

  expect(sections).toEqual([
    { html: expect.stringContaining('data-snapshot-status="Todo"') },
  ])
  expect(sections[0]).toMatchObject({
    html: expect.stringContaining('作者记录'),
  })
})

it('静态页面未能取得状态时向读者说明', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof fetch>().mockRejectedValueOnce(new Error('离线')),
  )
  vi.spyOn(console, 'warn').mockImplementation(() => {})

  const { sections } = await renderMarkdown(
    '[作者记录](https://github.com/example/render/issues/36)',
    { liveIssues: false },
  )

  expect(sections).toEqual([
    { html: expect.stringContaining('暂时无法获取状态') },
  ])
})
