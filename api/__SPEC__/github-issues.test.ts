import { readFile } from 'node:fs/promises'
import { afterEach, expect, it, vi } from 'vitest'
import { GET } from '../github-issues'

vi.mock('node:fs/promises', () => ({ readFile: vi.fn() }))

afterEach(() => {
  vi.unstubAllEnvs()
})

it('从 GET 请求读取仓库和页码，用服务端凭据获取公开在页面上的项目', async () => {
  vi.stubEnv('GITHUB_TOKEN', 'test-credential')
  vi.mocked(readFile).mockResolvedValue(
    '<GitHubProject repo="example/deployment" show-issues />',
  )

  const fetchPage = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(
      Response.json([{ state: 'open', number: 12, title: '文档反馈' }]),
    )

  vi.stubGlobal('fetch', fetchPage)

  const request = new Request(
    'https://example.test/api/github-issues?repository=example/deployment&page=2',
  )

  const response = await GET(request)

  expect(response.status).toBe(200)
  expect(await response.json()).toEqual({
    issues: [{ number: 12, title: '文档反馈', status: 'Open' }],
    nextPage: null,
  })

  const [url, options] = fetchPage.mock.calls[0]

  expect(new URL(String(url)).searchParams.get('page')).toBe('2')
  expect(new Headers(options?.headers).get('Authorization')).toBe(
    'Bearer test-credential',
  )
})

it('首页源文件读取失败时返回可重试的 503', async () => {
  vi.stubEnv('GITHUB_TOKEN', undefined)
  vi.mocked(readFile).mockRejectedValueOnce(new Error('首页读取失败'))
  vi.spyOn(console, 'warn').mockImplementation(() => {})

  const response = await GET(
    new Request('https://example.test/api/github-issues'),
  )

  expect(response.status).toBe(503)
  expect(response.headers.get('cache-control')).toBe('no-store')
})
