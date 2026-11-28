import { readFile } from 'node:fs/promises'
import { beforeEach, expect, it, vi } from 'vitest'
import { githubIssuesResponse } from '../project-issues'

vi.mock('node:fs/promises', () => ({ readFile: vi.fn() }))

const fetchPage = vi.fn<typeof fetch>()

beforeEach(() => {
  vi.mocked(readFile).mockReset()
  vi.stubGlobal('fetch', fetchPage.mockReset())
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

it.each([
  ['repository=site', 404],
  ['repository=example/site&page=0', 400],
  ['repository=example/site&page=1.5', 400],
  ['repository=example/site&page=9007199254740992', 400],
])('在读取内容前拒绝无效参数 %s', async (query, status) => {
  const response = await githubIssuesResponse(new URLSearchParams(query))

  expect(response.status).toBe(status)
  expect(readFile).not.toHaveBeenCalled()
  expect(fetchPage).not.toHaveBeenCalled()
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
  expect(fetchPage).not.toHaveBeenCalled()
})

it('发布的项目可以分页，并缓存成功的空页', async () => {
  vi.mocked(readFile).mockResolvedValue(
    '<GitHubProject repo="Example/Pages" show-issues />',
  )
  fetchPage.mockResolvedValueOnce(Response.json([]))

  const params = new URLSearchParams({ repository: 'example/pages', page: '2' })

  const response = await githubIssuesResponse(params)

  expect(response.status).toBe(200)
  expect(await response.json()).toEqual({ issues: [], nextPage: null })
  expect(response.headers.get('cache-control')).toContain('public')

  const [url] = fetchPage.mock.calls[0]

  expect(new URL(String(url)).searchParams.get('page')).toBe('2')
})

it('上游失败返回 503，下一次请求能重新加载首页', async () => {
  vi.mocked(readFile).mockResolvedValue(
    '<GitHubProject repo="example/retry" show-issues />',
  )
  fetchPage
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
  expect(fetchPage).toHaveBeenCalledTimes(2)
})
