import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  fetchGitHubIssuePage,
  fetchHomeIssues,
  fetchProjectIssuePage,
  normalizeRepository,
  parseIssueLink,
} from '../github-issues'

const repository = 'example/project'
const issueUrl = 'https://github.com/example/project/issues/7'
const openIssue = { number: 7, title: '修复分页', status: 'Open' }
const gitHubRow = { number: 7, title: '修复分页', state: 'open' }

afterEach(() => vi.unstubAllGlobals())

describe('GitHub 仓库和 issue 链接', () => {
  it('统一仓库名，保留 issue 编号，只识别独立的 issue 链接', () => {
    expect(normalizeRepository(' Example/Project ')).toBe(repository)
    expect(normalizeRepository('example/..')).toBeUndefined()
    expect(parseIssueLink(issueUrl)).toEqual({ repository, number: '7' })
    expect(parseIssueLink(issueUrl + '/comments')).toBeUndefined()
  })
})

describe('GitHub 列表接口', () => {
  it('保留打开的 issue 和项目状态，跳过 PR 与已关闭条目，读取下一页', async () => {
    const response = Response.json(
      [
        { ...gitHubRow, status: { name: 'In progress' } },
        { ...gitHubRow, number: 8 },
        { ...gitHubRow, number: 9, pull_request: {} },
        { ...gitHubRow, number: 10, state: 'closed' },
      ],
      {
        headers: {
          Link: '<https://api.github.com/repos/example/project/issues?page=3>; rel="next"',
        },
      },
    )

    const request = vi.fn<typeof fetch>().mockResolvedValue(response)

    vi.stubGlobal('fetch', request)

    await expect(fetchGitHubIssuePage(repository, 2)).resolves.toEqual({
      issues: [
        { ...openIssue, status: 'In progress' },
        { ...openIssue, number: 8 },
      ],
      nextPage: 3,
    })

    const [url] = request.mock.calls[0]

    expect(new URL(String(url)).searchParams.get('page')).toBe('2')
  })

  it.each([
    ['缺少 state', { number: 7, title: '修复分页' }],
    ['未知 state', { ...gitHubRow, state: 'unknown' }],
    ['PR 字段类型错误', { ...gitHubRow, pull_request: 'yes' }],
    ['项目状态缺少有效名称', { ...gitHubRow, status: { name: 42 } }],
    ['编号为零', { ...gitHubRow, number: 0 }],
    ['标题为空', { ...gitHubRow, title: ' ' }],
  ])('拒绝%s的条目', async (_label, row) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json([row])))

    await expect(fetchGitHubIssuePage(repository, 1)).rejects.toThrow()
  })
})

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
