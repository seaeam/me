import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchHomeIssues, fetchProjectIssuePage } from '../project-issues'

const repository = 'example/project'
const issueUrl = 'https://github.com/example/project/issues/7'
const openIssue = { number: 7, title: '修复分页', status: 'Open' }
const gitHubRow = { number: 7, title: '修复分页', state: 'open' }

afterEach(() => vi.unstubAllGlobals())

describe('站内项目接口', () => {
  it.each([
    ['缺少 issues', { nextPage: null }],
    ['缺少 nextPage', { issues: [] }],
    ['下一页没有前进', { issues: [], nextPage: 1 }],
    [
      '条目缺少状态',
      { issues: [{ number: 7, title: '修复分页' }], nextPage: null },
    ],
    [
      '条目编号无效',
      { issues: [{ ...openIssue, number: -1 }], nextPage: null },
    ],
  ])('拒绝%s的分页响应', async (_label, payload) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(payload)))

    await expect(
      fetchProjectIssuePage(
        repository,
        1,
        new AbortController().signal,
        'home.md',
      ),
    ).rejects.toThrow()
  })

  it.each([200, 404])(
    '静态站点返回 HTML（%s）时向 GitHub 请求同一页',
    async (status) => {
      const request = vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(
          new Response('<html></html>', {
            status,
            headers: { 'Content-Type': 'text/html' },
          }),
        )
        .mockResolvedValueOnce(Response.json([gitHubRow]))

      vi.stubGlobal('fetch', request)

      await expect(
        fetchProjectIssuePage(
          repository,
          2,
          new AbortController().signal,
          'home.md',
        ),
      ).resolves.toEqual({
        issues: [openIssue],
        nextPage: null,
      })

      const urls = request.mock.calls.map(
        ([url]) => new URL(String(url), 'https://example.test'),
      )

      expect(urls.map((url) => url.searchParams.get('page'))).toEqual([
        '2',
        '2',
      ])
      expect(urls.map((url) => url.hostname)).toEqual([
        'example.test',
        'api.github.com',
      ])
    },
  )

  it('站内接口返回服务错误时保留失败状态', async () => {
    const request = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 503 }))

    vi.stubGlobal('fetch', request)

    await expect(
      fetchProjectIssuePage(
        repository,
        1,
        new AbortController().signal,
        'home.md',
      ),
    ).rejects.toThrow('503')
    expect(request).toHaveBeenCalledTimes(1)
  })
})

describe('首页 issue 状态', () => {
  it('保留各链接的有效记录，缺少标题或状态的记录由快照接替', async () => {
    const details = { title: '修复分页', status: 'In progress' }

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        Response.json({
          [issueUrl]: details,
          [issueUrl + '1']: { status: 'Done' },
          [issueUrl + '2']: { title: '' },
        }),
      ),
    )

    await expect(fetchHomeIssues()).resolves.toEqual({ [issueUrl]: details })
  })

  it('接口返回 null 时沿用快照', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(null)))

    await expect(fetchHomeIssues()).resolves.toEqual({})
  })
})
