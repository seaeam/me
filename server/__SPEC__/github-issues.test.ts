import { readFile } from 'node:fs/promises'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { githubIssuesResponse } from '../github-issues'

vi.mock('node:fs/promises', () => ({ readFile: vi.fn() }))

const fetchGitHub = vi.fn<typeof fetch>()

beforeEach(() => {
  vi.mocked(readFile).mockReset()
  vi.stubGlobal('fetch', fetchGitHub.mockReset())
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

describe('项目 issue 列表', () => {
  it.each([
    ['repository=site', 404],
    ['repository=example/site&page=0', 400],
    ['repository=example/site&page=1.5', 400],
    ['repository=example/site&page=9007199254740992', 400],
  ])('在读取内容前拒绝无效参数 %s', async (query, status) => {
    const response = await githubIssuesResponse(new URLSearchParams(query))

    expect(response.status).toBe(status)
    expect(readFile).not.toHaveBeenCalled()
    expect(fetchGitHub).not.toHaveBeenCalled()
  })

  it('只读取指定文章中启用 issue 列表的项目', async () => {
    vi.mocked(readFile).mockResolvedValue(
      '<GitHubProject repo="example/site" :show-issues="false" />',
    )

    const params = new URLSearchParams({
      repository: 'example/site',
      source: 'posts/example.md',
    })

    const response = await githubIssuesResponse(params)

    expect(readFile).toHaveBeenCalledWith('content/posts/example.md', 'utf8')
    expect(response.status).toBe(404)
    expect(fetchGitHub).not.toHaveBeenCalled()
  })

  it('发布的项目可以分页，并缓存成功的空页', async () => {
    vi.mocked(readFile).mockResolvedValue(
      '<GitHubProject repo="Example/Pages" show-issues />',
    )
    fetchGitHub.mockResolvedValueOnce(Response.json([]))

    const params = new URLSearchParams({
      repository: 'example/pages',
      page: '2',
    })

    const response = await githubIssuesResponse(params)

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ issues: [], nextPage: null })
    expect(response.headers.get('cache-control')).toContain('public')

    const [url] = fetchGitHub.mock.calls[0]

    expect(new URL(String(url)).searchParams.get('page')).toBe('2')
  })

  it('上游失败返回 503，下一次请求能重新加载首页', async () => {
    vi.mocked(readFile).mockResolvedValue(
      '<GitHubProject repo="example/retry" show-issues />',
    )
    fetchGitHub
      .mockResolvedValueOnce(new Response(null, { status: 429 }))
      .mockResolvedValueOnce(Response.json([]))

    const params = new URLSearchParams({ repository: 'example/retry' })

    const failed = await githubIssuesResponse(params)
    const recovered = await githubIssuesResponse(params)
    const cached = await githubIssuesResponse(params)

    expect(failed.status).toBe(503)
    expect(failed.headers.get('cache-control')).toBe('no-store')
    expect(recovered.status).toBe(200)
    expect(await cached.json()).toEqual({ issues: [], nextPage: null })
    expect(fetchGitHub).toHaveBeenCalledTimes(2)
  })
})

describe('首页 issue 卡片', () => {
  it('首页没有独立 issue 链接时返回可缓存的空结果', async () => {
    vi.mocked(readFile).mockResolvedValue('# 首页')

    const response = await githubIssuesResponse(new URLSearchParams())

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({})
    expect(response.headers.get('cache-control')).toContain('max-age=3600')
    expect(fetchGitHub).not.toHaveBeenCalled()
  })

  it('去重同一链接，在部分请求失败时只返回已知结果并禁止缓存', async () => {
    const first = 'https://github.com/example/partial/issues/1'
    const second = 'https://github.com/example/partial/issues/2'

    vi.mocked(readFile).mockResolvedValue(
      `[一](${first})\n\n[重复](${first})\n\n[二](${second})`,
    )
    fetchGitHub
      .mockResolvedValueOnce(Response.json({ title: '更新标题', status: null }))
      .mockResolvedValueOnce(new Response(null, { status: 503 }))

    const response = await githubIssuesResponse(new URLSearchParams())

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      [first]: { title: '更新标题', status: 'No status' },
    })
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(fetchGitHub).toHaveBeenCalledTimes(2)
  })

  it('所有链接均缺少标题时返回暂不可用', async () => {
    vi.mocked(readFile).mockResolvedValue(
      '[一](https://github.com/example/invalid/issues/1)',
    )
    fetchGitHub.mockResolvedValueOnce(Response.json({ state: 'open' }))

    const response = await githubIssuesResponse(new URLSearchParams())

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
    fetchGitHub.mockResolvedValueOnce(Response.json(data))

    const response = await githubIssuesResponse(new URLSearchParams())

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

    const response = await githubIssuesResponse(new URLSearchParams())

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({})
    expect(fetchGitHub).not.toHaveBeenCalled()
  })

  it('忽略首页 HTML 注释中未展示的 Markdown 链接', async () => {
    vi.mocked(readFile).mockResolvedValue(
      '<!--\n\n[未发布](https://github.com/example/draft/issues/1)\n\n-->',
    )

    const response = await githubIssuesResponse(new URLSearchParams())

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({})
    expect(fetchGitHub).not.toHaveBeenCalled()
  })
})
